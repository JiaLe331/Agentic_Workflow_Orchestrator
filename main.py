import os
import argparse
import asyncio
from dotenv import load_dotenv

# Load env variables (e.g., OPENAI_API_KEY)
load_dotenv()

from agents.agent_1_intent import process_intent
from agents.agent_2_planner import plan_workflow
from agents.agent_3_n8n import generate_n8n_workflow

async def main():
    parser = argparse.ArgumentParser(description="Agentic Workflow Orchestrator")
    parser.add_argument("--query", type=str, help="The user's natural language request")
    args = parser.parse_args()

    user_query = args.query
    if not user_query:
        # Default example if no query provided
        user_query = "i want to know what is the cost of all employees this month and generate me a UI"
        print(f"No query provided. Using default: '{user_query}'\n")

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

    # --- Step 2: Agent 2 (Planner) ---
    print("\n[Agent 2] Planning Workflow Nodes...")
    try:
        workflow_plan = plan_workflow(generalized_workflow)
        print(f"  > Generated {len(workflow_plan.nodes)} workflow nodes.")
        for node in workflow_plan.nodes:
            print(f"    - [{node.id}] {node.function}: {node.description}")
    except Exception as e:
        print(f"Agent 2 Failed: {e}")
        return

    # --- Step 3: Agent 3 (n8n Generator) ---
    print("\n[Agent 3] Generating n8n JSON Code...")
    try:
        n8n_json = generate_n8n_workflow(workflow_plan)
        
        # Post-Processing: Inject Webhook for API execution (Deterministic)
        from agents.utils import inject_webhook_node
        n8n_json = inject_webhook_node(n8n_json)
        
        print("  > n8n Workflow Generated Successfully.")
        
        # Save to file
        output_file = "workflow_output.json"
        with open(output_file, "w") as f:
            f.write(n8n_json)
        print(f"  > Saved to {output_file}")
        
    except Exception as e:
        print(f"Agent 3 Failed: {e}")
        return

    print("\n" + "=" * 50)
    print("Workflow Construction Complete")
    
    # --- Step 4: Immediate Execution ---
    # If the user has configured n8n credentials, deploy and run immediately.
    if os.getenv("N8N_API_KEY"):
        print("-" * 50)
        print("[Auto-Execution] N8N_API_KEY detected. Deploying to n8n...")
        from n8n_executor import execute_workflow_via_api
        execute_workflow_via_api()
        
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(main())