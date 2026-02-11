import requests
import json

# API Endpoint URL
# Assuming the API is running on localhost:4000
API_URL = "http://localhost:4000/workflows"

def create_workflow():
    payload = {
        "title": "Python Generated Workflow",
        "description": "This workflow was created via a Python script.",
        "tablesInvolved": ["users", "orders"],
        "uiType": "dashboard",
        "uiCode": "<h1>Hello from Python</h1>",
        "workflowUrl": "https://n8n.io/workflows/1234", # Example external link
        "nodesJson": {
        }
    }

    try:
        response = requests.post(API_URL, json=payload)
        response.raise_for_status() # Raise detailed error for bad responses

        new_workflow = response.json()
        print("✅ Workflow created successfully!")
        print(f"ID: {new_workflow['id']}")
        print(f"Title: {new_workflow['title']}")
        print(f"URL: {new_workflow.get('workflowUrl', 'N/A')}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Error creating workflow: {e}")
        if e.response:
             print(f"Response: {e.response.text}")

if __name__ == "__main__":
    create_workflow()
