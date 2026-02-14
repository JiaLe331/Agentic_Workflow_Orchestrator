
import os
import asyncio
from playwright.async_api import async_playwright
from dotenv import load_dotenv
from services.firebase_service import upload_file_to_firebase

load_dotenv()

N8N_HOST = os.getenv("N8N_HOST", "http://localhost:5678")

async def crawl_and_screenshot_workflow(workflow_id: str):
    """
    Opens the n8n workflow editor for the given workflow_id,
    takes a screenshot, and uploads it to Firebase.
    """
    workflow_url = f"{N8N_HOST}/workflow/{workflow_id}"
    print(f"[Crawler] Crawling {workflow_url}...")

    # Define output file path
    # TODO: change the pathname later
    local_filename = f"screenshot_{workflow_id}.png"
    local_path = os.path.join("/tmp/uploads", local_filename)

    # Ensure tmp directory exists TODO: change the pathname later
    os.makedirs("/tmp/uploads", exist_ok=True)

    async with async_playwright() as p:
        # Launch browser (headless=True for background execution)
        browser = await p.chromium.launch(headless=True)
        
        # New context with viewport size
        context = await browser.new_context(viewport={"width": 1920, "height": 1080})
        page = await context.new_page()

        try:
            print(f"[Crawler] Navigating to {workflow_url}...")
            await page.goto(workflow_url, wait_until="networkidle")
            # Check if redirected to login
            if "signin" in page.url or "login" in page.url or await page.locator("input[type='email']").count() > 0:
                print("[Crawler] Login page detected. Logging in...")
                try:
                    # Fill credentials
                    # Use env vars for credentials
                    username = os.getenv("N8N_USERNAME")
                    password = os.getenv("N8N_PASSWORD")
                    
                    if not username or not password:
                        print("[Crawler] Warning: N8N_USERNAME or N8N_PASSWORD not set.")

                    await page.fill("input[type='email']", username)
                    await page.fill("input[type='password']", password)
                    
                    # Click Sign In
                    await page.click("button") 
                    
                    print("[Crawler] Credentials submitted. Waiting for navigation...")
                    await page.wait_for_url(f"{N8N_HOST}/workflow/**", timeout=15000)
                    print("[Crawler] Login successful.")
                except Exception as e:
                    print(f"[Crawler] Login failed: {e}")
                    # Capture login failure screenshot for debugging
                    await page.screenshot(path=local_path.replace(".png", "_login_fail.png"), full_page=False)
                    raise e

            await asyncio.sleep(5) 

            # Take screenshot
            await page.screenshot(path=local_path, full_page=False)
            print(f"[Crawler] Screenshot saved to {local_path}")
            
            # Close browser
            await browser.close()
            destination_filename = "preview.png"
            public_url = upload_file_to_firebase(local_path, workflow_id, destination_filename)

            print(f"[Crawler] Screenshot uploaded successfully: {public_url}")
            return public_url

        except Exception as e:
            print(f"[Crawler] Error taking screenshot: {e}")
            await browser.close()
            return None
        finally:
            # Cleanup local file
            if os.path.exists(local_path):
                os.remove(local_path)

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        asyncio.run(crawl_and_screenshot_workflow(sys.argv[1]))
    else:
        print("Usage: python n8n_crawler.py <workflow_id>")
