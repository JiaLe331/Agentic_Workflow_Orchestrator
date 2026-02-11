import requests
import json

def store_workflow_in_backend(api_base_url, workflow_data):
    """
    Stores a workflow in the backend via POST request.

    Args:
        api_base_url (str): The base URL of the API (e.g. 'http://localhost:4000').
        workflow_data (dict): The workflow data to store.
    
    Returns:
        dict: The created workflow object from the API response.
    """
    endpoint = f"{api_base_url}/workflows"
    
    # Payload structure matching the CreateWorkflowDto
    payload = {
        "title": workflow_data.get("title", "Untitled Workflow"),
        "description": workflow_data.get("description", ""),
        "tablesInvolved": workflow_data.get("tablesInvolved", []), # List of strings
        "uiType": workflow_data.get("uiType", "default"),
        "uiCode": workflow_data.get("uiCode", ""),
        "workflowUrl": workflow_data.get("workflowUrl", ""), # The external n8n URL
        "nodesJson": workflow_data.get("nodesJson", {}) # The actual n8n workflow JSON object
    }

    try:
        response = requests.post(
            endpoint, 
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error storing workflow: {e}")
        if e.response:
            print(f"Response: {e.response.text}")
        raise

# Example Usage:
if __name__ == "__main__":
    # 1. Define your workflow data (e.g. from your Python logic)
    my_workflow = {
        "title": "Automated Data Sync",
        "description": "Syncs data from Source A to Source B every hour.",
        "tablesInvolved": ["users", "transactions"],
        "uiType": "dashboard",
        "workflowUrl": "https://n8n.your-domain.com/workflow/123",
        "nodesJson": {
            "nodes": [{"id": "1", "name": "Start"}], 
            "connections": {}
        }
    }

    # 2. Call the function
    try:
        created_workflow = store_workflow_in_backend("http://localhost:4000", my_workflow)
        print(f"Success! Created workflow with ID: {created_workflow['id']}")
    except:
        print("Failed to create workflow.")
