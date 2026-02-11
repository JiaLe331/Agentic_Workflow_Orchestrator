import requests
import json
from agents.models import GeneralizedWorkflow, WorkflowPlan

def save_workflow_to_api(generalized_workflow: GeneralizedWorkflow, n8n_json: str, workflow_plan: WorkflowPlan = None, n8n_workflow_id: str = None, user_prompt: str = None, execution_result: object = None, webhook_url: str = None):
    """
    Saves the generated workflow to the backend API.
    """
    API_URL = "http://localhost:4000/workflows"
    
    # Construct URL
    # Assuming standard n8n URL format or user's preference
    if n8n_workflow_id:
        # We can try to use the local instance URL if we know it, or n8n.io placeholder if not.
        # But user said "pass the url properly".
        # Let's use the local format since we are deploying locally.
        # Format: http://localhost:5678/workflow/{id}
        workflow_url = f"http://localhost:5678/workflow/{n8n_workflow_id}"
    else:
        workflow_url = "https://n8n.io/workflows/placeholder"
        
    try:
        nodes_json_obj = json.loads(n8n_json)
    except:
        nodes_json_obj = {}
        
    payload = {
        "title": generalized_workflow.intent,
        "description": f"Operation: {generalized_workflow.operation} on {generalized_workflow.target_table}",
        "tablesInvolved": [generalized_workflow.target_table] if generalized_workflow.target_table else [],
        "uiType": generalized_workflow.ui_type if generalized_workflow.ui_type else "dashboard",
        "uiCode": "", # Placeholder
        "workflowUrl": workflow_url,
        "nodesJson": nodes_json_obj,
        "executionPlan": [node.dict() for node in workflow_plan.nodes] if workflow_plan else [],
        "userPrompt": user_prompt,
        "result": execution_result,
        "webhookUrl": webhook_url
    }
    
    print(f"\n[System] Persisting workflow to {API_URL}...")
    try:
        response = requests.post(API_URL, json=payload)
        response.raise_for_status()
        
        new_workflow = response.json()
        print("✅ Workflow saved successfully!")
        print(f"   ID: {new_workflow.get('id')}")
        print(f"   Title: {new_workflow.get('title')}")
        if 'workflowUrl' in new_workflow:
             print(f"   URL: {new_workflow['workflowUrl']}")
             
    except requests.exceptions.RequestException as e:
        print(f"❌ Error saving workflow to API: {e}")
