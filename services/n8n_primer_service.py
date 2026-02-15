import os
import asyncio
from playwright.async_api import async_playwright, BrowserContext
from dotenv import load_dotenv

load_dotenv()

N8N_HOST = os.getenv("N8N_HOST", "http://localhost:5678")
N8N_USER = os.getenv("N8N_USERNAME")
N8N_PASS = os.getenv("N8N_PASSWORD")

import requests

# Module-level reference to keep background sessions alive
_active_sessions = {}


def _discover_workflow_url(webhook_uuid: str) -> str | None:
    """Find the n8n direct URL for this webhook UUID from our local API."""
    try:
        response = requests.get("http://localhost:4000/workflows")
        if response.status_code == 200:
            data = response.json()
            match = next((w for w in data if w.get("webhookUrl") and webhook_uuid in w["webhookUrl"]), None)
            if match:
                url = match.get("workflowUrl")
                if url and "host.docker.internal" in url:
                    url = url.replace("host.docker.internal", "localhost")
                return url
    except Exception as e:
        print(f"[Primer] Local API discovery failed: {e}")
    return None


async def prime_n8n_test_execution(webhook_url: str):
    """
    Two-Phase Priming:
    Phase 1 (SYNCHRONOUS - blocks until n8n is listening):
      1. Navigate to the workflow canvas.
      2. Click 'Execute workflow'.
      3. Wait for the 'Listening' state.
    Phase 2 (BACKGROUND - keeps session alive):
      4. Keep browser alive for 60s so n8n completes execution.
      5. Close the browser.
    """
    webhook_uuid = webhook_url.split("/")[-1]
    print(f"[Primer] ⚡ Priming for UUID: {webhook_uuid}")

    n8n_direct_url = _discover_workflow_url(webhook_uuid)
    if n8n_direct_url:
        print(f"[Primer] Direct link found: {n8n_direct_url}")

    p = await async_playwright().start()
    context_dir = "/tmp/n8n_playwright_context"
    os.makedirs(context_dir, exist_ok=True)

    context = await p.chromium.launch_persistent_context(
        user_data_dir=context_dir,
        headless=True,
        viewport={"width": 1440, "height": 900},
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    page = context.pages[0] if context.pages else await context.new_page()

    try:
        # 1. Navigate
        target_url = n8n_direct_url if n8n_direct_url else f"{N8N_HOST}/home/workflows?search={webhook_uuid}"
        print(f"[Primer] Navigating directly to canvas...")
        await page.goto(target_url, wait_until="domcontentloaded")

        # 2. Fast Login (only if session is lost)
        try:
            login_indicator = page.locator("input[type='email']")
            await login_indicator.wait_for(state="visible", timeout=3000)
            print("[Primer] Session expired. Performing Fast Login...")
            await page.fill("input[type='email']", N8N_USER)
            await page.keyboard.press("Tab")
            await page.keyboard.type(N8N_PASS)
            await page.keyboard.press("Enter")
            await page.wait_for_url(f"**/workflow/**", timeout=10000)
        except:
            pass

        # 3. Search Fallback (if direct navigation was impossible)
        if not n8n_direct_url:
            print("[Primer] Using search fallback...")
            workflow_row = page.locator("tr.workflow-item, .workflow-list-item, div.workflow-item-name, h2").first
            await workflow_row.wait_for(state="visible", timeout=5000)
            await workflow_row.click()

        # 4. Wait for canvas to fully load, then click Execute
        print("[Primer] Waiting for canvas buttons...")
        execute_selector = "button[data-test-id='execute-workflow-button-Webhook'], button[data-test-id='execute-workflow-button']"

        # Give the canvas more time to render (up to 15s)
        await page.wait_for_selector(execute_selector, timeout=15000)
        # Small delay to let any animations settle
        await asyncio.sleep(0.5)
        print("[Primer] Clicking 'Execute workflow'...")
        await page.click(execute_selector, force=True)

        # 5. Verify listening state
        await page.wait_for_selector("button:has-text('Waiting'), button:has-text('Stop'), [data-icon='stop']", timeout=7000)
        print("✅ [Primer] Activated and listening.")

        # --- PHASE 1 COMPLETE: n8n is now listening ---
        # Store session reference so the background keep-alive can use it
        _active_sessions[webhook_uuid] = {"context": context, "playwright": p}

        # Schedule background keep-alive (non-blocking)
        asyncio.create_task(_keep_alive_and_cleanup(webhook_uuid, 60))

        # Return control — the caller can now POST to the webhook
        return

    except Exception as e:
        print(f"❌ [Primer] UI Error: {e}")
        os.makedirs("/tmp/uploads", exist_ok=True)
        await page.screenshot(path=f"/tmp/uploads/primer_error_{webhook_uuid[:8]}.png")
        # Clean up on error
        await context.close()
        await p.stop()
        raise e


async def _keep_alive_and_cleanup(webhook_uuid: str, duration_seconds: int):
    """Background task: keep the browser alive, then clean up."""
    print(f"[Primer] Keeping session alive for {duration_seconds}s...")
    try:
        await asyncio.sleep(duration_seconds)
    except asyncio.CancelledError:
        pass
    finally:
        session = _active_sessions.pop(webhook_uuid, None)
        if session:
            try:
                await session["context"].close()
                await session["playwright"].stop()
            except Exception:
                pass
            print(f"[Primer] Session for {webhook_uuid} closed. Cleanup completed.")
