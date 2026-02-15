import os
import asyncio
from playwright.async_api import async_playwright
from dotenv import load_dotenv

load_dotenv()

N8N_HOST = os.getenv("N8N_HOST", "http://localhost:5678")
N8N_USER = os.getenv("N8N_USERNAME")
N8N_PASS = os.getenv("N8N_PASSWORD")

import requests

async def prime_n8n_test_execution(webhook_url: str):
    """
    ULTRA-FAST Direct Navigation Priming:
    1. Discovery: Extract 'workflowUrl' from local API.
    2. Direct Jump: Navigate directly to the n8n canvas.
    3. Persistent Session: Uses /tmp/n8n_playwright_context to keep user logged in.
    """
    webhook_uuid = webhook_url.split("/")[-1]
    print(f"[Primer] ⚡ Priming for UUID: {webhook_uuid}")

    # Step 0: Find n8n direct link (workflowUrl) from our local API
    # The record ID (2159efe6...) is NOT the n8n ID (os7ZXX...). workflowUrl is the correct link.
    n8n_direct_url = None
    try:
        response = requests.get("http://localhost:4000/workflows")
        if response.status_code == 200:
            data = response.json()
            # Match by webhook_url substring (UUID)
            match = next((w for w in data if w.get("webhookUrl") and webhook_uuid in w["webhookUrl"]), None)
            if match:
                n8n_direct_url = match.get("workflowUrl")
                # Ensure it points to the local host if needed (sometimes URLs are stored as docker host)
                if n8n_direct_url and "host.docker.internal" in n8n_direct_url:
                     n8n_direct_url = n8n_direct_url.replace("host.docker.internal", "localhost")
                print(f"[Primer] Direct link found: {n8n_direct_url}")
    except Exception as e:
        print(f"[Primer] Local API discovery failed: {e}")

    async with async_playwright() as p:
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
            # 1. Navigate Direct or Search Fallback
            if n8n_direct_url:
                target_url = n8n_direct_url
            else:
                target_url = f"{N8N_HOST}/home/workflows?search={webhook_uuid}"
            
            print(f"[Primer] Navigating directly to canvas...")
            await page.goto(target_url, wait_until="commit")

            # 2. Fast Login (Only if session is lost)
            # Give it a small window to see if we are on signin
            try:
                login_indicator = page.locator("input[type='email']")
                await login_indicator.wait_for(state="visible", timeout=3000)
                print("[Primer] Session expired. Performing Fast Login...")
                await page.fill("input[type='email']", N8N_USER)
                await page.keyboard.press("Tab")
                await page.keyboard.type(N8N_PASS)
                await page.keyboard.press("Enter")
                # Wait for the target page to actually load after login
                await page.wait_for_url(f"**/workflow/**", timeout=10000)
            except:
                # If signin doesn't appear in 3s, assume we are either logged in or on search page
                pass

            # 3. Search Fallback (if direct navigation was impossible)
            if not n8n_direct_url:
                print("[Primer] Using search fallback...")
                workflow_row = page.locator("tr.workflow-item, .workflow-list-item, div.workflow-item-name, h2").first
                await workflow_row.wait_for(state="visible", timeout=5000)
                await workflow_row.click()
            
            # 4. Activate (Canvas)
            print("[Primer] Waiting for canvas buttons...")
            execute_selector = "button[data-test-id='execute-workflow-button-Webhook'], button[data-test-id='execute-workflow-button']"
            
            # Canvas load can take a few seconds
            await page.wait_for_selector(execute_selector, timeout=10000)
            print("[Primer] Clicking 'Execute workflow'...")
            await page.click(execute_selector, force=True)
            
            # Verify listening state
            await page.wait_for_selector("button:has-text('Waiting'), button:has-text('Stop'), [data-icon='stop']", timeout=7000)
            print("✅ [Primer] Activated and listening.")

        except Exception as e:
            print(f"❌ [Primer] UI Error: {e}")
            os.makedirs("/tmp/uploads", exist_ok=True)
            await page.screenshot(path=f"/tmp/uploads/primer_error_{webhook_uuid[:8]}.png")
        finally:
            await context.close()
