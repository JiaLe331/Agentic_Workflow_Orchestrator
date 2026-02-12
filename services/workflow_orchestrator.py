import os
from dotenv import load_dotenv

load_dotenv()

from agents.agent_1_intent import process_intent
from agents.agent_2_planner import plan_workflow

from agents.agent_3_n8n import generate_n8n_workflow
from services.workflow_persistence import save_workflow_to_api
from utils.n8n_executor import execute_workflow_via_api
from utils.n8n_crawler import crawl_and_screenshot_workflow
from utils.validators import validate_phone_number

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
        if generalized_workflow.additional_inputs:
             # Validate Phone Number if present
            if "whatsapp_number" in generalized_workflow.additional_inputs:
                raw_phone = generalized_workflow.additional_inputs["whatsapp_number"]
                validated_phone = validate_phone_number(raw_phone)
                generalized_workflow.additional_inputs["whatsapp_number"] = validated_phone
                print(f"  > Validated Phone: {validated_phone}")
            
            print(f"  > Additional Inputs: {generalized_workflow.additional_inputs}")
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
            n8n_json = generate_n8n_workflow(workflow_plan, feedback_error, previous_json, context_text)
            
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
                # Save what we have before returning.
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
    
    n8n_workflow_id = None
    execution_result = None
    webhook_url = None
    uploaded_url = None
    saved_db_record = None

    if valid:
        # 1. Save to local file (Required for execution script)
        output_file = "test/workflow_output.json"
        with open(output_file, "w") as f:
            f.write(last_generated_json)
        print(f"  > Saved to {output_file}")
        
        # 2. Persist to API (Database) FIRST
        # We don't have n8n_id or execution results yet, but we secure the record.
        print("\n[System] Persisting workflow to DB before execution...")
        try:
             # We pass None for runtime values initially
             saved_db_record = save_workflow_to_api(
                 generalized_workflow, 
                 last_generated_json, 
                 workflow_plan, 
                 n8n_workflow_id=None, 
                 user_query=user_query, 
                 execution_result=None, 
                 webhook_url=None, 
                 uploaded_url=None
             )
        except Exception as e:
            print(f"  > Warning: DB Persistence failed: {e}")

        # 3. Auto-Execute (Deploy & Trigger)
        if os.getenv("N8N_API_KEY"):
            print("-" * 50)
            print("[Auto-Execution] N8N_API_KEY detected. Deploying to n8n...")
            
            # This function currently handles: Import -> Activate -> Trigger Webhook
            n8n_workflow_id, execution_result, webhook_url = execute_workflow_via_api()
            
            # --- Step 5: Screenshot & Upload (New) ---
            if n8n_workflow_id:
                print(f"\n[Crawler] Initiating screenshot for workflow {n8n_workflow_id}...")
                try:
                    uploaded_url = await crawl_and_screenshot_workflow(n8n_workflow_id)
                    if uploaded_url:
                        print(f"  > Screenshot uploaded: {uploaded_url}")
                        
                    # TODO: Update the previously saved DB record with these new details (ID, URL, Result)
                    # For now, we just print them, effectively fulfilling the "Save then Activate" flow.
                    if saved_db_record:
                         print(f"  > (Logic to update DB record {saved_db_record.get('id', '?')} with n8n ID {n8n_workflow_id} goes here)")
                         
                except Exception as e:
                    print(f"❌ Crawler Failed: {e}")
        
    print("\n" + "=" * 50)
    print("Workflow Construction Complete")
    print("=" * 50)
    
    return True # Or some result object
