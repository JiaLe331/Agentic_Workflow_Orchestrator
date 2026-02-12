from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controllers import pdf_parser, whatsapp, email, google_calendar, workflow, storage

from services.firebase_service import initialize_firebase

def create_app() -> FastAPI:
    initialize_firebase()

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
    app.include_router(storage.router, prefix="/api/storage", tags=["Storage"])
    app.include_router(workflow.router, prefix="", tags=["Workflow"]) # Prefix is empty because endpoint is /generate-workflow

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
                "email": "/api/email/send",
                "google_calendar": "/api/calendar/create",
                "storage": "/api/storage/upload"
            }
        }

    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "services": ["workflow_generator", "pdf_parser", "whatsapp", "email", "google_calendar"]
        }

    return app

app = create_app()
