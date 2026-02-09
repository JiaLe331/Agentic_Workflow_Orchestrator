"""
Email Controller

FastAPI endpoints for sending emails (freeform and templated).
Used by n8n workflows via HTTP Request nodes.
"""

import os
import smtplib
import ssl
import uuid
from typing import Optional, List, Dict, Any
from pathlib import Path
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from email.message import EmailMessage
from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader, select_autoescape

load_dotenv()

# Create router
router = APIRouter()

# SMTP configuration (use environment variables)
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "0"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)

# Optional: API key validation
API_KEY = os.getenv("API_KEY", None)


# ============================================
# MODELS
# ============================================

class EmailRequest(BaseModel):
    to: str
    subject: str
    body: Optional[str] = None
    html: Optional[str] = None
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None


class TemplatedEmailRequest(BaseModel):
    to: str
    template: str
    variables: Dict[str, Any]
    subject: Optional[str] = None
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None


class EmailResponse(BaseModel):
    success: bool
    message_id: Optional[str] = None
    to: Optional[str] = None
    error: Optional[str] = None


# ============================================
# HELPERS
# ============================================

def validate_api_key(x_api_key: Optional[str] = Header(None)):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True


def smtp_configured() -> bool:
    return bool(SMTP_HOST and SMTP_PORT and SMTP_USER and SMTP_PASSWORD)


def load_template(template_name: str):
    root = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    templates_dir = root / "templates" / "email"
    template_path = templates_dir / template_name
    if not template_path.exists():
        # Allow passing template name without extension
        template_path = templates_dir / f"{template_name}.html"
        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_name}")

    env = Environment(
        loader=FileSystemLoader(str(templates_dir)),
        autoescape=select_autoescape(["html", "xml"]),
        enable_async=False,
    )

    return env.get_template(template_path.name)


def send_via_smtp(message: EmailMessage) -> str:
    # Ensure SMTP config present
    if not smtp_configured():
        raise RuntimeError("SMTP configuration not found in environment variables")

    # Use a generated Message-ID if not present
    if "Message-ID" not in message:
        message_id = f"<{uuid.uuid4()}@local>"
        message["Message-ID"] = message_id
    else:
        message_id = message["Message-ID"]

    context = ssl.create_default_context()

    # Port 465 -> SSL, otherwise use STARTTLS
    if SMTP_PORT == 465:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(message)
    else:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(message)

    return str(message_id)


# ============================================
# ENDPOINTS
# ============================================


@router.post("/send", response_model=EmailResponse)
async def send_email(request: EmailRequest, x_api_key: Optional[str] = Header(None)):
    """Send a freeform email (plain text or html)."""
    if API_KEY:
        validate_api_key(x_api_key)

    if not request.to:
        raise HTTPException(status_code=400, detail="Recipient 'to' is required")

    # Build message
    msg = EmailMessage()
    msg["From"] = FROM_EMAIL
    msg["To"] = request.to
    msg["Subject"] = request.subject

    if request.cc:
        msg["Cc"] = ", ".join(request.cc)
    if request.bcc:
        # BCC not added to headers but kept for recipients list when sending
        pass

    try:
        if request.html:
            # Add plain text fallback
            text_body = request.body or ""
            msg.set_content(text_body)
            msg.add_alternative(request.html, subtype="html")
        else:
            msg.set_content(request.body or "")

        # Ensure recipients list includes cc and bcc
        recipients = [r.strip() for r in request.to.split(",")] if isinstance(request.to, str) else request.to
        if request.cc:
            recipients += request.cc
        if request.bcc:
            recipients += request.bcc

        # Send
        message_id = send_via_smtp(msg)

        return EmailResponse(success=True, message_id=message_id, to=request.to)

    except Exception as e:
        return EmailResponse(success=False, to=request.to, error=str(e))


@router.post("/send-templated", response_model=EmailResponse)
async def send_templated_email(request: TemplatedEmailRequest, x_api_key: Optional[str] = Header(None)):
    """Send email using a named HTML template and variables."""
    if API_KEY:
        validate_api_key(x_api_key)

    try:
        template = load_template(request.template)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Render template
    try:
        rendered_html = template.render(**request.variables)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error rendering template: {e}")

    # Subject fallback
    subject = request.subject or request.variables.get("subject") or "Notification"

    # Build message
    msg = EmailMessage()
    msg["From"] = FROM_EMAIL
    msg["To"] = request.to
    msg["Subject"] = subject
    if request.cc:
        msg["Cc"] = ", ".join(request.cc)

    # Plain text fallback: strip tags minimally if needed
    text_fallback = request.variables.get("text_fallback") or ""
    msg.set_content(text_fallback)
    msg.add_alternative(rendered_html, subtype="html")

    try:
        message_id = send_via_smtp(msg)
        return EmailResponse(success=True, message_id=message_id, to=request.to)
    except Exception as e:
        return EmailResponse(success=False, to=request.to, error=str(e))


@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "email",
        "smtp_configured": smtp_configured(),
        "from_email": FROM_EMAIL
    }
