import os
from dotenv import load_dotenv

load_dotenv()

from fastapi.concurrency import run_in_threadpool

from agents.agent_1_intent import process_intent
from agents.agent_2_planner import plan_workflow

from agents.agent_3_n8n import generate_n8n_workflow
from services.workflow_persistence import save_workflow_to_api
from utils.n8n_executor import import_workflow, activate_workflow, trigger_webhook
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
        # Run synchronous agent in threadpool to avoid blocking event loop
        generalized_workflow = await run_in_threadpool(process_intent, user_query)
        
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
        # Run synchronous agent in threadpool
        workflow_plan = await run_in_threadpool(plan_workflow, generalized_workflow, context_text)
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
            # Run synchronous agent in threadpool
            n8n_json = await run_in_threadpool(generate_n8n_workflow, workflow_plan, feedback_error, previous_json, context_text)
            
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
    
    # --- Step 4: Execution & Persistence ---
    # Strict Order: Import -> Crawl -> Save DB -> Execute -> Update DB
    
    n8n_workflow_id = None
    execution_result = None
    webhook_url = None
    uploaded_url = None
    saved_db_record = None

    if valid:
        import json
        workflow_json_obj = json.loads(last_generated_json)

        # 1. Save to local file (Required for debugging/reference)
        output_file = "test/workflow_output.json"
        with open(output_file, "w") as f:
            f.write(last_generated_json)
        print(f"  > Saved to {output_file}")
        
        if os.getenv("N8N_API_KEY"):
            print("-" * 50)
            print("[Orchestrator] Starting Sequential Deployment...")

            # 2. Import to n8n (Get ID)
            # Run blocking import in threadpool
            new_workflow = await run_in_threadpool(import_workflow, workflow_json_obj)
            if new_workflow:
                n8n_workflow_id = new_workflow['id']
                
                # 3. Crawl & Screenshot (Get Image URL)
                print(f"\n[Crawler] Initiating screenshot for workflow {n8n_workflow_id}...")
                try:
                    uploaded_url = await crawl_and_screenshot_workflow(n8n_workflow_id)
                    if uploaded_url:
                         print(f"  > Screenshot uploaded: {uploaded_url}")
                except Exception as e:
                    print(f"❌ Crawler Failed: {e}")

                # 4. Save to DB (PRE-EXECUTION)
                print("\n[System] Persisting workflow to DB (Pre-Execution)...")
                try:
                     # Run blocking DB save in threadpool
                     saved_db_record = await run_in_threadpool(
                         save_workflow_to_api,
                         generalized_workflow, 
                         last_generated_json, 
                         workflow_plan, 
                         n8n_workflow_id=n8n_workflow_id, 
                         user_prompt=user_query, 
                         execution_result=None, # Not executed yet
                         webhook_url=None,      # Not triggered yet (though predictable)
                         image_url=uploaded_url
                     )
                except Exception as e:
                    print(f"  > Warning: DB Persistence failed: {e}")

                # 5. Execute: Activate & Trigger
                print(f"[Orchestrator] Activating and Triggering Workflow {n8n_workflow_id}...")
                
                # Run blocking activation in threadpool
                await run_in_threadpool(activate_workflow, n8n_workflow_id)
                
                # Run blocking webhook trigger in threadpool
                execution_result, webhook_url = await run_in_threadpool(trigger_webhook, workflow_json_obj)
                
                # 6. Update DB (POST-EXECUTION) - Optional but good for completeness
                # Since we have a new result, we should nominally save it or update the record.
                # Simplest way is to call save again (it creates a new history record usually)
                # or just log it. 
                if execution_result:
                     print(f"[Orchestrator] Execution finished. Result obtained.")
                     # TODO: Update DB with execution result
    
    print("\n" + "=" * 50)
    print("Workflow Construction Complete")
    print("=" * 50)
    
    return True # Or some result object
