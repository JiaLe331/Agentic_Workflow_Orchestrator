from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from services.workflow_orchestrator import run_workflow_generation

router = APIRouter()

class WorkflowRequest(BaseModel):
    prompt: str
    client_id: str = None

@router.post("/generate-workflow")
async def generate_workflow(request: WorkflowRequest, background_tasks: BackgroundTasks):
    print(f"[API] Received prompt: {request.prompt} Client ID: {request.client_id}")
    try:
        # Enqueue the long-running task
        background_tasks.add_task(run_workflow_generation, request.prompt, request.client_id)
        
        return {"status": "accepted", "message": "Workflow generation started in background."}
            
    except Exception as e:
        print(f"[API] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
