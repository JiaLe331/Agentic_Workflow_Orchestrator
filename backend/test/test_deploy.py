
import os
import json
import requests
import time
from dotenv import load_dotenv

# python test/test_deploy.py
# Load environment variables
load_dotenv()

N8N_HOST = os.getenv("N8N_HOST", "http://localhost:5678")
N8N_API_KEY = os.getenv("N8N_API_KEY")

import uuid

def deploy_workflow():
    """
    Loads 'workflow_output.json', imports it into n8n, and activates it.
    """
    if not N8N_API_KEY:
        print("❌ Error: N8N_API_KEY not found in .env")
        return

    workflow_file = "workflow_output.json"
    if not os.path.exists(workflow_file):
        print(f"❌ Error: {workflow_file} not found.")
        return

    print(f"📂 Loading {workflow_file}...")
    with open(workflow_file, "r") as f:
        workflow_json = json.load(f)

    # Clean up and ensure Name
    if "id" in workflow_json:
        del workflow_json["id"]
    
    if "name" not in workflow_json:
        workflow_json["name"] = f"Test Workflow {int(time.time())}"

    # Ensure 'settings' exists (Required by API)
    if "settings" not in workflow_json:
        workflow_json["settings"] = {}

    # Unique Webhook Path for Testing
    # Prevents "Conflict with one of the webhooks" error on repeated runs
    webhook_path_used = "webhook"
    if "nodes" in workflow_json:
        for node in workflow_json["nodes"]:
            if node.get("type") == "n8n-nodes-base.webhook":
                unique_suffix = str(uuid.uuid4())[:8]
                new_path = f"webhook-test-{unique_suffix}"
                node["parameters"]["path"] = new_path
                webhook_path_used = new_path
                print(f"🔄 Patched Webhook Path to: {new_path}")
                break

    headers = {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json"
    }

    # 1. Import (Create)
    print(f"🚀 Deploying '{workflow_json['name']}' to {N8N_HOST}...")
    create_url = f"{N8N_HOST}/api/v1/workflows"
    
    try:
        response = requests.post(create_url, json=workflow_json, headers=headers)
        response.raise_for_status()
        new_workflow = response.json()
        workflow_id = new_workflow['id']
        print(f"✅ Workflow Created! ID: {workflow_id}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Import Failed: {e}")
        if e.response is not None:
             print(f"Response Body: {e.response.text}")
        return
    except Exception as e:
        print(f"❌ Import Failed (Unknown): {e}")
        return

    # 2. Activate
    print(f"🔌 Activating workflow {workflow_id}...")
    activate_url = f"{N8N_HOST}/api/v1/workflows/{workflow_id}/activate"
    
    try:
        requests.post(activate_url, headers=headers, json={"active": True}).raise_for_status()
        print(f"✅ Workflow ACTIVATED successfully.")
        print(f"   You can inspect it at: {N8N_HOST}/workflow/{workflow_id}")
        print(f"   Trigger URL: {N8N_HOST}/webhook/{webhook_path_used}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Activation Failed: {e}")
        if e.response is not None:
             print(f"Response Body: {e.response.text}")
    except Exception as e:
        print(f"❌ Activation Failed (Unknown): {e}")

if __name__ == "__main__":
    deploy_workflow()
