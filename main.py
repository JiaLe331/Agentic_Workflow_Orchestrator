import argparse
import asyncio
from dotenv import load_dotenv

load_dotenv()

from services.workflow_orchestrator import run_workflow_generation

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
        uvicorn.run("router_factory:app", host="0.0.0.0", port=8000, reload=True)