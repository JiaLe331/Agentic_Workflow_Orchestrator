import os
from dotenv import load_dotenv

load_dotenv()

from fastapi.concurrency import run_in_threadpool

from agents.agent_0_guard import check_safety
from agents.agent_1_intent import process_intent
from agents.agent_2_planner import plan_workflow

from agents.agent_3_n8n import generate_n8n_workflow
from services.workflow_persistence import save_workflow_to_api, update_workflow_in_api
from utils.n8n_executor import import_workflow, activate_workflow, trigger_webhook
from utils.n8n_crawler import crawl_and_screenshot_workflow
from utils.validators import validate_phone_number
from services.websocket_manager import manager

async def run_workflow_generation(user_query: str, client_id: str = None):
    """
    Orchestrates the workflow generation process.
    Returns the saved workflow result (dict) or None if failed.
    """
    print("-" * 50)
    print(f"USER REQUEST: {user_query}")
    print("-" * 50)

    async def safe_send(data: dict):
        """Helper to safely send WS messages without raising exceptions."""
        if client_id:
            try:
                await manager.send_message(client_id, data)
            except Exception as e:
                print(f"[Orchestrator] WS Send Warning: {e}")

    try:
        # --- Step 0: Agent 0 (Guard) ---
        print("\n[Agent 0] Checking Safety...")
        await safe_send({"type": "log", "data": "[Agent 0] Checking Safety..."})
        
        try:
            safety_response = await run_in_threadpool(check_safety, user_query)
            
            if not safety_response.is_safe:
                msg = f"❌ BLOCKED: Unsafe Request Detected\n   Reason: {safety_response.reason}"
                print(msg)
                await safe_send({"type": "log", "data": msg})
                await safe_send({"type": "complete", "data": "Request blocked by safety guard."})
                return None
                
            print("  > Request is Safe. Proceeding...")
            await safe_send({"type": "log", "data": "  > Request is Safe. Proceeding..."})

        except Exception as e:
            print(f"Agent 0 Failed: {e}")
            # Decide here: Fail open or closed? 
            # For now, let's log and proceed, assuming it's an API error, but maybe warn.
            print("  > Warning: Guard check failed, proceeding with caution.")

        # --- Step 1: Agent 1 (Intent) ---
        print("\n[Agent 1] Analyzing Intent & Schema...")
        try:
            # Run synchronous agent in threadpool to avoid blocking event loop
            # CRITICAL: We pass the RAW 'user_query' directly to Agent 1.
            # We do NOT use any output from Agent 0 (except the safety boolean check above).
            generalized_workflow = await run_in_threadpool(process_intent, user_query)
            
            # --- DISRUPTOR CHECK ---
            if generalized_workflow.validation_error:
                msg = f"❌ DISRUPTOR TRIGGERED: Schema Validation Failed\n   Reason: {generalized_workflow.validation_error}"
                print(msg)
                await safe_send({"type": "log", "data": msg})
                return
                
            print(f"  > Intent: {generalized_workflow.intent}")
            await safe_send({
                "type": "step", 
                "status": "intent_analyzed", 
                "data": {
                    "intent": generalized_workflow.intent, 
                    "title": generalized_workflow.title, 
                    "operation": generalized_workflow.operation,
                    "target_table": generalized_workflow.target_table,
                    "required_docs": generalized_workflow.required_docs or []
                }
            })

            print(f"  > Title: {generalized_workflow.title}")
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

            if generalized_workflow.values:
                print(f"  > Values (DB Columns): {generalized_workflow.values}")
                await safe_send({"type": "log", "data": f"  > Extracted Values: {generalized_workflow.values}"})
            
            print(f"  > [Agent 1] is_recyclable: {generalized_workflow.is_recyclable}")   
        except Exception as e:
            print(f"Agent 1 Failed: {e}")
            return

        # --- Step 2: Context Loading ---
        print("\n[System] Loading Context Docs...")
        await safe_send({"type": "log", "data": "[System] Loading Context Docs..."})
        context_text = ""
        if generalized_workflow.required_docs is None:
            generalized_workflow.required_docs = []
        
        # ALWAYS load webhook_input_block.md as mandatory context
        webhook_doc_path = os.path.join("docs", "webhook_input_block.md")
        if os.path.exists(webhook_doc_path):
            with open(webhook_doc_path, "r") as f:
                context_text += f"\n\n--- webhook_input_block.md (MANDATORY) ---\n{f.read()}"
        
        if generalized_workflow.required_docs:
            print(f"  > Required Docs: {generalized_workflow.required_docs}")
            for doc_name in generalized_workflow.required_docs:
                doc_path = os.path.join("docs", doc_name)
                if os.path.exists(doc_path):
                    with open(doc_path, "r", encoding="utf-8") as f:
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
            print(f"  > [Agent 2] input_requirements: {workflow_plan.input_requirements}")
            await safe_send({
                "type": "step", 
                "status": "planned", 
                "data": {
                    "node_count": len(workflow_plan.nodes),
                    "nodes": [n.dict() for n in workflow_plan.nodes]
                }
            })

            for node in workflow_plan.nodes:
                print(f"    - [{node.id}] {node.function}: {node.description}")
        except Exception as e:
            print(f"Agent 2 Failed: {e}")
            return

        # --- Step 4: Agent 3 (n8n Generator) ---
        print("\n[Agent 3] Generating n8n JSON Code...")
        await safe_send({"type": "log", "data": "[Agent 3] Generating n8n JSON Code..."})
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
                n8n_json = await run_in_threadpool(generate_n8n_workflow, workflow_plan, generalized_workflow, feedback_error, previous_json, context_text)
                
                # Webhook is now generated natively by Agent 3 (no inject needed)
                
                last_generated_json = n8n_json # Capture for persistence
                
                # Analyze Input Requirements from Agent 2
                input_reqs = workflow_plan.input_requirements
                if input_reqs:
                    print(f"  > Detected Input Requirements: {input_reqs}")
                    await safe_send({"type": "log", "data": f"Detected Inputs: {input_reqs}"})
                
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
                    save_workflow_to_api(generalized_workflow, last_generated_json, custom_title=generalized_workflow.title, custom_description=generalized_workflow.intent)
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
                     save_workflow_to_api(generalized_workflow, last_generated_json, workflow_plan, custom_title=generalized_workflow.title, custom_description=generalized_workflow.intent)
                return

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
            
            await safe_send({"type": "step", "status": "generated", "data": {"json_length": len(last_generated_json)}})

            if os.getenv("N8N_API_KEY"):
                print("-" * 50)
                print("[Orchestrator] Starting Sequential Deployment...")

                # 2. Import to n8n (Get ID)
                # Run blocking import in threadpool
                try:
                    new_workflow = await run_in_threadpool(import_workflow, workflow_json_obj)
                except Exception as e:
                    print(f"❌ Import to n8n Failed: {e}")
                    new_workflow = None

                if new_workflow:
                    await safe_send({"type": "log", "data": "Imported to n8n..."})
                    n8n_workflow_id = new_workflow['id']
                    
                    # 3. Crawl & Screenshot (Get Image URL)
                    print(f"\n[Crawler] Initiating screenshot for workflow {n8n_workflow_id}...")
                    try:
                        uploaded_url = await crawl_and_screenshot_workflow(n8n_workflow_id)
                        if uploaded_url:
                             print(f"  > Screenshot uploaded: {uploaded_url}")
                             await safe_send({"type": "step", "status": "screenshot", "data": {"url": uploaded_url}})
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
                             image_url=uploaded_url,
                             custom_title=generalized_workflow.title,
                             custom_description=generalized_workflow.intent,
                             input_requirements=workflow_plan.input_requirements
                         )
                    except Exception as e:
                        print(f"  > Warning: DB Persistence failed: {e}")

                    # 5. Execute: Activate & Trigger
                    print(f"[Orchestrator] Activating and Triggering Workflow {n8n_workflow_id}...")
                    
                    # Run blocking activation in threadpool
                    try:
                        await run_in_threadpool(activate_workflow, n8n_workflow_id)
                    except Exception as e:
                        print(f"❌ Activate Workflow Failed: {e}")
                    
                    # Run blocking webhook trigger in threadpool
                    try:
                        execution_result, webhook_url = await run_in_threadpool(trigger_webhook, workflow_json_obj)
                    except Exception as e:
                        print(f"❌ Trigger Webhook Failed: {e}")
                    
                    # 6. Update DB (POST-EXECUTION) with webhook_url
                    if saved_db_record and saved_db_record.get('id'):
                         db_id = saved_db_record['id']
                         update_fields = {}
                         if webhook_url:
                              update_fields['webhookUrl'] = webhook_url
                         if execution_result:
                              update_fields['result'] = str(execution_result) if not isinstance(execution_result, str) else execution_result
                         if update_fields:
                              print(f"[Orchestrator] Updating DB record {db_id} with webhook_url...")
                              try:
                                  await run_in_threadpool(update_workflow_in_api, db_id, **update_fields)
                              except Exception as e:
                                  print(f"❌ DB Update Failed: {e}")
                    
                    if execution_result:
                         print(f"[Orchestrator] Execution finished. Result obtained.")
                         await safe_send({"type": "step", "status": "executed", "data": {"result": execution_result}})
                    
                    # Signal completion
                    await safe_send({"type": "complete", "data": "Workflow generation process finished."})
        
        print("\n" + "=" * 50)
        print("Workflow Construction Complete")
        print("=" * 50)
        
        return True

    except Exception as e:
        import traceback
        print(f"\n❌ [Orchestrator] CRITICAL ERROR: {e}")
        traceback.print_exc()
        await safe_send({"type": "error", "data": f"Internal Error: {str(e)}"})
        return None
