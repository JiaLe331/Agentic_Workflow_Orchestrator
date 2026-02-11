
import os
import argparse
import asyncio
from dotenv import load_dotenv

load_dotenv()

from agents.agent_1_intent import process_intent
from agents.agent_2_planner import plan_workflow

from agents.agent_3_n8n import generate_n8n_workflow
from controllers.workflow import save_workflow_to_api
from utils.n8n_executor import execute_workflow_via_api

async def run_workflow_generation(user_query: str):
    """
    Orchestrates the workflow generation process.
    Returns the saved workflow result (dict) or None if failed.
    """
    print("-" * 50)
    print(f"USER REQUEST: {user_query}")
    print("-" * 50)

    # --- Step 1: Agent 1 (Intent) ---
    print("\n[Agent 1] Analyzing Intent & Schema...")
    try:
        generalized_workflow = process_intent(user_query)
        
        # --- DISRUPTOR CHECK ---
        if generalized_workflow.validation_error:
            print(f"\n❌ DISRUPTOR TRIGGERED: Schema Validation Failed")
            print(f"   Reason: {generalized_workflow.validation_error}")
            print("   > Aborting workflow generation.")
            return

        print(f"  > Intent: {generalized_workflow.intent}")
        print(f"  > Target Table: {generalized_workflow.target_table}")
        print(f"  > Operation: {generalized_workflow.operation}")
    except Exception as e:
        print(f"Agent 1 Failed: {e}")
        return

    # --- Step 2: Context Loading ---
    print("\n[System] Loading Context Docs...")
    context_text = ""
    if generalized_workflow.required_docs:
        print(f"  > Required Docs: {generalized_workflow.required_docs}")
        for doc_name in generalized_workflow.required_docs:
            doc_path = os.path.join("docs", doc_name)
            if os.path.exists(doc_path):
                with open(doc_path, "r") as f:
                    context_text += f"\n\n--- {doc_name} ---\n{f.read()}"
            else:
                print(f"  > Warning: Doc {doc_name} not found.")
    else:
        print("  > No specific docs requested. Using generic context.")

    # --- Step 3: Agent 2 (Planner) ---
    print("\n[Agent 2] Planning Workflow Nodes...")
    try:
        # Pass context_text to plan_workflow
        workflow_plan = plan_workflow(generalized_workflow, context_text)
        print(f"  > Generated {len(workflow_plan.nodes)} workflow nodes.")
        for node in workflow_plan.nodes:
            print(f"    - [{node.id}] {node.function}: {node.description}")
    except Exception as e:
        print(f"Agent 2 Failed: {e}")
        return

    # --- Step 4: Agent 3 (n8n Generator) ---
    print("\n[Agent 3] Generating n8n JSON Code...")
    MAX_RETRIES = 3
    retry_count = 0
    valid = False
    
    # Feedback variables for retries
    feedback_error = None
    previous_json = None
    
    # Keep track of the LAST generated JSON to save regardless of success
    last_generated_json = None
    
    from agents.agent_validator import validate_n8n_workflow, CriticalValidationFailure

    while retry_count < MAX_RETRIES and not valid:
        try:
            # Agent 3 generation (with optional feedback)
            n8n_json = generate_n8n_workflow(workflow_plan, feedback_error, previous_json)
            
            # Post-Processing: Inject Webhook
            from agents.utils import inject_webhook_node
            n8n_json = inject_webhook_node(n8n_json)
            
            last_generated_json = n8n_json # Capture for persistence
            
            # --- VALIDATION ---
            print(f"  > Validating generated workflow (Attempt {retry_count + 1})...")
            try:
                validate_n8n_workflow(n8n_json)
                valid = True
                print("  > Validation Passed.")
            except CriticalValidationFailure as cvf:
                print(f"\n❌ DISRUPTOR TRIGGERED: Critical Schema Violation")
                print(f"   Reason: {cvf}")
                print("   > Aborting workflow generation immediately.")
                # Even if critical failure, we might want to save? 
                # User said "regardless if it works or fails". 
                # But critical failure usually means we abort. 
                # Let's save what we have before returning.
                save_workflow_to_api(generalized_workflow, last_generated_json)
                return 
            except Exception as ve:
                print(f"  > Validation Failed: {ve}")
                
                # Prepare feedback for next retry
                feedback_error = str(ve)
                previous_json = n8n_json
                
                print("  > Retrying Agent 3 with feedback...")
                retry_count += 1
                if retry_count == MAX_RETRIES:
                    print("  > Max retries reached. Proceeding to save failed workflow.")
        except Exception as e:
            print(f"Agent 3 Failed: {e}")
            # If agent 3 fails hard, we might not have json.
            if last_generated_json:
                 save_workflow_to_api(generalized_workflow, last_generated_json, workflow_plan)
            return

    # --- Step 4: Execution & Persistence ---
    # We need to execute FIRST to get the real ID, then persist to API.
    
    n8n_workflow_id = None
    execution_result = None
    webhook_url = None
    
    # 1. Save to local file (Required for execution script)
    if valid:
        output_file = "workflow_output.json"
        with open(output_file, "w") as f:
            f.write(last_generated_json)
        print(f"  > Saved to {output_file}")
        
        # 2. Auto-Execute if Key Exists
        if os.getenv("N8N_API_KEY"):
            print("-" * 50)
            print("[Auto-Execution] N8N_API_KEY detected. Deploying to n8n...")
            n8n_workflow_id, execution_result, webhook_url = execute_workflow_via_api()

    # 3. Persist to API (After execution attempt to capture ID)
    if last_generated_json:
        # We return the response from save_workflow_to_api if we modified it to return the response object/json
        # But controller currently prints. Let's assume successful persistence.
        save_workflow_to_api(generalized_workflow, last_generated_json, workflow_plan, n8n_workflow_id, user_query, execution_result, webhook_url)
        # In a real scenario, we might want to return the saved ID here.
        
    print("\n" + "=" * 50)
    print("Workflow Construction Complete")
    print("=" * 50)
    
    return True # Or some result object

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Agentic Workflow Orchestrator")
    parser.add_argument("--query", type=str, help="The user's natural language request")
    parser.add_argument("--server", action="store_true", help="Start the API server (default behavior)")
    args = parser.parse_args()

    if args.query:
        asyncio.run(run_workflow_generation(args.query))
    else:
        # Default to starting the server
        import uvicorn
        print("\n[System] Starting API Server on http://0.0.0.0:8000 ...")
        # Ensure we are in the right directory or python path includes current dir
        uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)