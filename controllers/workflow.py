from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.workflow_orchestrator import run_workflow_generation

router = APIRouter()

class WorkflowRequest(BaseModel):
    prompt: str

@router.post("/generate-workflow")
async def generate_workflow(request: WorkflowRequest):
    print(f"[API] Received prompt: {request.prompt}")
    try:
        # run_workflow_generation is async
        result = await run_workflow_generation(request.prompt)
        
        if result:
            return {"status": "success", "message": "Workflow generated and saved successfully."}
        else:
            raise HTTPException(status_code=500, detail="Workflow generation failed internal check.")
            
    except Exception as e:
        print(f"[API] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
