
import os
import json
import requests
import time
from dotenv import load_dotenv

# Load env vars
load_dotenv()

N8N_HOST = os.getenv("N8N_HOST", "http://localhost:5678")
N8N_API_KEY = os.getenv("N8N_API_KEY") 
# Note: N8N_API_KEY is required for the Public API (v1). 
# If credentials are not set, the script will prompt or fail.

def execute_workflow_via_api():
    if not N8N_API_KEY:
        print("❌ Error: N8N_API_KEY not found in .env")
        print("Please create an API Key in n8n (Settings > Public API) and add it to .env")
        return None, None, None

    workflow_file = "test/workflow_output.json"
    if not os.path.exists(workflow_file):
        print(f"❌ Error: {workflow_file} not found. Run main.py first.")
        print(f"❌ Error: {workflow_file} not found. Run main.py first.")
        return None, None, None

    print(f"Loading {workflow_file}...")
    with open(workflow_file, "r") as f:
        workflow_json = json.load(f)
        
    result_json = None
    result_json = None
    workflow_id = None
    webhook_url = None

    # 1. Import Workflow (Create)
    # Removing ID matching to force creation of a NEW workflow instance (or we could update if ID exists)
    if "id" in workflow_json:
        del workflow_json["id"]
        
    # Ensure 'name' exists (Required by API)
    if "name" not in workflow_json:
        workflow_json["name"] = f"AI Workflow {int(time.time())}"
        
    # Ensure 'settings' exists (Required by API)
    if "settings" not in workflow_json:
        workflow_json["settings"] = {}
        
    # Headers
    headers = {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json"
    }

    print(f"🚀 Importing workflow '{workflow_json['name']}' to n8n...")
    create_url = f"{N8N_HOST}/api/v1/workflows"
    try:
        response = requests.post(create_url, json=workflow_json, headers=headers)
        response.raise_for_status()
        new_workflow = response.json()
        workflow_id = new_workflow['id']
        workflow_name = new_workflow['name']
        print(f"✅ Imported: {workflow_name} (ID: {workflow_id})")
    except requests.exceptions.RequestException as e:
        print(f"❌ Import Failed: {e}")
        if e.response is not None:
             print(f"Response Body: {e.response.text}")
        return None, None, None
    except Exception as e:
        print(f"❌ Import Failed (Unknown): {e}")
        return None, None, None

    # 2. Activate Workflow
    print(f"🔌 Activating workflow {workflow_id}...")
    activate_url = f"{N8N_HOST}/api/v1/workflows/{workflow_id}/activate"
    try:
        requests.post(activate_url, headers=headers, json={"active": True}).raise_for_status()
        print("✅ Workflow Activated")
        time.sleep(2) # Give n8n a moment to register the webhook
    except Exception as e:
        print(f"❌ Activation Failed: {e}")
        # Continue? If activation fails, webhook might not work.
        return workflow_id, None, None

    # 3. Trigger Webhook
    # Dynamic: Find the correct webhook path from the JSON (it's now unique)
    webhook_path = "webhook" # Default
    if "nodes" in workflow_json:
        for node in workflow_json["nodes"]:
            if node.get("type") == "n8n-nodes-base.webhook":
                webhook_path = node.get("parameters", {}).get("path", "webhook")
                break
    
    webhook_url = f"{N8N_HOST}/webhook/{webhook_path}"
    
    print(f"⚡ Triggering Webhook: {webhook_url}")
    try:
        # Try Production URL First
        resp = requests.post(webhook_url, json={"trigger": "auto-executor"})
        
        # If 404, try Test URL
        if resp.status_code == 404:
            print(f"⚠️ Production webhook 404. Trying Test Webhook...")
            test_webhook_url = f"{N8N_HOST}/webhook-test/{webhook_path}"
            print(f"⚡ Triggering Test Webhook: {test_webhook_url}")
            resp = requests.post(test_webhook_url, json={"trigger": "auto-executor"})

        if resp.ok:
             print("✅ Execution Triggered & Completed Successfully!")
             try:
                 result_json = resp.json()
                 print("👇 Execution Result:")
                 print(json.dumps(result_json, indent=2))
             except:
                 print(f"Response (Text): {resp.text}")
        else:
             print(f"⚠️ Triggered but received error: {resp.status_code}")
             print(resp.text)
    except Exception as e:
        print(f"❌ Webhook Trigger Failed: {e}")
        
    return workflow_id, result_json, webhook_url

if __name__ == "__main__":
    execute_workflow_via_api()
