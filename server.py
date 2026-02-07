from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio
from main import run_workflow_generation

app = FastAPI()

class WorkflowRequest(BaseModel):
    prompt: str

@app.post("/generate-workflow")
async def generate_workflow(request: WorkflowRequest):
    """
    Endpoint to trigger workflow generation from a natural language prompt.
    """
    print(f"[API] Received prompt: {request.prompt}")
    
    try:
        # Run the workflow generation logic
        # Note: This is a long-running process. Ideally we should run it in background,
        # but the requirement is "saves in the db immediately" (so we wait?).
        # "return a success when you retrieved the POST request ... and then saves in the db immediately"
        # This implies we might want to return 202 Accepted if it's async, or 200 OK if we wait.
        # User said "saves in the db immediately", which might mean "before returning" (?)
        # Or "saves ... immediately" after retrieval. 
        # I'll make it blocking for now to be safe and ensure completion.
        
        result = await run_workflow_generation(request.prompt)
        
        if result:
            return {"status": "success", "message": "Workflow generated and saved successfully."}
        else:
            raise HTTPException(status_code=500, detail="Workflow generation failed internal check.")
            
    except Exception as e:
        print(f"[API] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
