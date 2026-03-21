
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

def get_headers():
    if not N8N_API_KEY:
        print("❌ Error: N8N_API_KEY not found in .env")
        return None
    return {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json"
    }

def import_workflow(workflow_json: dict) -> dict:
    """
    Imports a workflow json into n8n. Returns the full workflow object (including ID).
    """
    headers = get_headers()
    if not headers: return None

    # Cleaning for Import
    if "id" in workflow_json:
        del workflow_json["id"]
    if "name" not in workflow_json:
        workflow_json["name"] = f"AI Workflow {int(time.time())}"
    if "settings" not in workflow_json:
        workflow_json["settings"] = {}

    print(f"🚀 Importing workflow '{workflow_json['name']}' to n8n...")
    create_url = f"{N8N_HOST}/api/v1/workflows"
    try:
        response = requests.post(create_url, json=workflow_json, headers=headers)
        response.raise_for_status()
        new_workflow = response.json()
        print(f"✅ Imported: {new_workflow['name']} (ID: {new_workflow['id']})")
        return new_workflow
    except Exception as e:
        print(f"❌ Import Failed: {e}")
        return None

def activate_workflow(workflow_id: str) -> bool:
    """
    Activates an existing workflow by ID.
    """
    headers = get_headers()
    if not headers: return False

    print(f"🔌 Activating workflow {workflow_id}...")
    activate_url = f"{N8N_HOST}/api/v1/workflows/{workflow_id}/activate"
    try:
        requests.post(activate_url, headers=headers, json={"active": True}).raise_for_status()
        print("✅ Workflow Activated")
        time.sleep(2) 
        return True
    except Exception as e:
        print(f"❌ Activation Failed: {e}")
        return False

def trigger_webhook(workflow_json: dict) -> tuple:
    """
    Determines the webhook URL from the JSON and triggers it.
    Returns (result_json, webhook_url)
    """
    webhook_path = ""
    if "nodes" in workflow_json:
        for node in workflow_json["nodes"]:
            if node.get("type") == "n8n-nodes-base.webhook":
                params = node.get("parameters", {})
                # Priority: path parameter > webhookId
                webhook_path = params.get("path") or node.get("webhookId")
                break
    
    if not webhook_path:
        webhook_path = "webhook" # Fallback
        
    test_webhook_url = f"{N8N_HOST}/webhook-test/{webhook_path}"
    
    print(f"⚡ Triggering Test Webhook: {test_webhook_url}")
    
    result_json = None
    try:
        # Prioritize Test URL as requested
        resp = requests.post(test_webhook_url, json={"trigger": "auto-executor"})
        webhook_url = test_webhook_url

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
         webhook_url = test_webhook_url # Fallback for return
         
    return result_json, webhook_url

def execute_workflow_via_api():
    """
    Facade for backward compatibility: Import -> Activate -> Trigger
    """
    workflow_file = "test/workflow_output.json"
    if not os.path.exists(workflow_file):
        print(f"❌ Error: {workflow_file} not found.")
        return None, None, None

    print(f"Loading {workflow_file}...")
    with open(workflow_file, "r", encoding="utf-8") as f:
        workflow_json = json.load(f)

    # 1. Import
    new_workflow = import_workflow(workflow_json)
    if not new_workflow:
        return None, None, None
    workflow_id = new_workflow['id']

    # 2. Activate
    activate_workflow(workflow_id)

    # 3. Trigger
    result_json, webhook_url = trigger_webhook(workflow_json)

    return workflow_id, result_json, webhook_url

if __name__ == "__main__":
    execute_workflow_via_api()
