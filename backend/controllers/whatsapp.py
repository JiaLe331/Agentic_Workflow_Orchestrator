"""
WhatsApp Controller

FastAPI endpoint for sending WhatsApp messages via Twilio.
Used by n8n workflows via HTTP Request nodes.
"""

import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

# Create router
router = APIRouter()

# Twilio configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER")  # Format: whatsapp:+14155238886




# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class WhatsAppMessage(BaseModel):
    """Request model for sending WhatsApp message"""
    to: str  # Phone number with country code, e.g., +60123456789
    message: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "to": "+60123456789",
                "message": "Hello! This is a test message from your automation system."
            }
        }


class WhatsAppResponse(BaseModel):
    """Response model for WhatsApp send"""
    success: bool
    output: Optional[str] = None # message_sid
    metadata: Optional[dict] = None
    error: Optional[str] = None


# ============================================
# HELPER FUNCTIONS
# ============================================




def get_twilio_client() -> Client:
    """
    Initialize Twilio client.
    Raises exception if credentials not configured.
    """
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env"
        )
    
    return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)


def format_whatsapp_number(phone: str) -> str:
    """
    Format phone number for WhatsApp.
    Normalizes Malaysian numbers: 01... -> +601... and 60... -> +60...
    Converts +60123456789 to whatsapp:+60123456789
    """
    phone = phone.strip().replace(" ", "").replace("-", "")
    
    # Handle Malaysian normalization
    if phone.startswith("01"):
        phone = f"+60{phone[1:]}"
    elif phone.startswith("60") and not phone.startswith("+"):
        phone = f"+{phone}"
        
    if not phone.startswith("whatsapp:"):
        phone = f"whatsapp:{phone}"
    return phone


# ============================================
# ENDPOINTS
# ============================================

@router.post("/send", response_model=WhatsAppResponse)
async def send_whatsapp_message(
    request: WhatsAppMessage
):
    """
    Send a WhatsApp message via Twilio.
    
    **Prerequisites:**
    1. Twilio account with WhatsApp enabled
    2. Set environment variables:
       - TWILIO_ACCOUNT_SID
       - TWILIO_AUTH_TOKEN
       - TWILIO_WHATSAPP_NUMBER (your Twilio WhatsApp number)
    
    **Usage from n8n:**
    ```
    HTTP Request Node:
    - Method: POST
    - URL: http://localhost:8000/api/whatsapp/send
    - Body JSON:
      {
        "to": "+60123456789",
        "message": "Hello from automation!"
      }
    - Headers: x-api-key: your-api-key (optional)
    ```
    
    **Response:**
    ```json
    {
        "success": true,
        "output": "SM1234567890abcdef",
        "metadata": {
            "status": "queued",
            "to": "+60123456789"
        }
    }
    ```
    """
    # Validate phone number
    if not request.to:
        raise HTTPException(
            status_code=400,
            detail="Phone number is required"
        )
    
    # Validate message
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    # Check Twilio WhatsApp number configured
    if not TWILIO_WHATSAPP_NUMBER:
        raise HTTPException(
            status_code=500,
            detail="TWILIO_WHATSAPP_NUMBER not configured in .env"
        )
    
    try:
        # Initialize Twilio client
        client = get_twilio_client()
        
        # Format numbers
        from_number = format_whatsapp_number(TWILIO_WHATSAPP_NUMBER)
        to_number = format_whatsapp_number(request.to)
        
        # Send message
        message = client.messages.create(
            from_=from_number,
            to=to_number,
            body=request.message
        )
        
        # Return response
        return WhatsAppResponse(
            success=True,
            output=message.sid,
            metadata={
                "status": message.status,
                "to": request.to
            }
        )
    
    except Exception as e:
        # Return error response
        return WhatsAppResponse(
            success=False,
            error=str(e),
            metadata={"to": request.to}
        )


@router.post("/send-template", response_model=WhatsAppResponse)
async def send_whatsapp_template(
    to: str,
    template_name: str
):
    """
    Send a pre-approved WhatsApp template message.
    
    **Note:** Template messages must be pre-approved by WhatsApp.
    For hackathon/demo, use the /send endpoint instead.
    
    **Usage:**
    ```json
    {
        "to": "+60123456789",
        "template_name": "welcome_message"
    }
    ```
    """
    # For now, this is a placeholder
    # In production, you'd send actual template messages
    raise HTTPException(
        status_code=501,
        detail="Template messages not implemented yet. Use /send endpoint for demo."
    )


# ============================================
# HEALTH CHECK
# ============================================

@router.get("/health")
async def health_check():
    """
    Check if WhatsApp service is configured
    """
    return {
        "status": "ok",
        "service": "whatsapp",
        "twilio_configured": bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN),
        "whatsapp_number_configured": bool(TWILIO_WHATSAPP_NUMBER)
    }


@router.get("/test-config")
async def test_configuration():
    """
    Test Twilio configuration without sending a message.
    Returns account info if credentials are valid.
    """
    try:
        client = get_twilio_client()
        account = client.api.accounts(TWILIO_ACCOUNT_SID).fetch()
        
        return {
            "success": True,
            "account_sid": account.sid,
            "account_status": account.status,
            "friendly_name": account.friendly_name,
            "whatsapp_number": TWILIO_WHATSAPP_NUMBER
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Twilio configuration error: {str(e)}"
        )
