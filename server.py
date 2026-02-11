
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from controllers import pdf_parser, whatsapp, email, google_calendar

from main import run_workflow_generation

app = FastAPI(
    title="DerivHack Workflow API",
    description="Microservices API for n8n workflow automation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(pdf_parser.router, prefix="/api", tags=["PDF Parser"])
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["WhatsApp"])
app.include_router(email.router, prefix="/api/email", tags=["Email"])
app.include_router(google_calendar.router, prefix="/api/calendar", tags=["Google Calendar"])


class WorkflowRequest(BaseModel):
    prompt: str

@app.post("/generate-workflow")
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

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "DerivHack Workflow API",
        "docs": "/docs",
        "endpoints": {
            "generate_workflow": "/generate-workflow",
            "pdf_parser": "/api/parse-pdf",
            "whatsapp": "/api/whatsapp/send",
            "email": "/api/email/send",
            "google_calendar": "/api/calendar/create"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": ["workflow_generator", "pdf_parser", "whatsapp", "email", "google_calendar"]
    }
