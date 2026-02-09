"""
Controllers package for FastAPI endpoints.

Each controller handles a specific integration:
- pdf_parser: PDF upload and data extraction
- whatsapp: Send WhatsApp messages via Twilio
"""

from fastapi import APIRouter

# Import routers from controllers
from .pdf_parser import router as pdf_router
from .whatsapp import router as whatsapp_router
from .email import router as email_router
from .google_calendar import router as google_calendar_router

# Optional: export a list of routers for inclusion in a FastAPI app
routers = [
	(pdf_router, "/api"),
	(whatsapp_router, "/api/whatsapp"),
	(email_router, "/api/email"),
	(google_calendar_router, "/api/calendar"),
]
