"""
PDF Parser Controller - RAW TEXT EXTRACTION ONLY

Simplified endpoint that extracts raw text from PDFs using LlamaParse.
Gemini processing is handled by n8n's Gemini node instead.

Used by n8n workflows via HTTP Request nodes.
"""

import os
import tempfile
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from pydantic import BaseModel
from dotenv import load_dotenv
from llama_parse import LlamaParse

load_dotenv()

# Create router
router = APIRouter()

# Optional: API key validation
API_KEY = os.getenv("API_KEY", None)


# ============================================
# RESPONSE MODEL
# ============================================

class PDFParseResponse(BaseModel):
    """Response model for PDF parsing"""
    success: bool
    raw_text: Optional[str] = None
    error: Optional[str] = None
    filename: str
    page_count: Optional[int] = None
    character_count: Optional[int] = None


# ============================================
# HELPER FUNCTION
# ============================================

def validate_api_key(x_api_key: Optional[str] = Header(None)):
    """Optional API key validation (only if API_KEY set in .env)"""
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True


# ============================================
# RAW TEXT EXTRACTION ENDPOINT
# ============================================

@router.post("/parse-pdf", response_model=PDFParseResponse)
async def parse_pdf_raw_text(
    file: UploadFile = File(...),
    x_api_key: Optional[str] = Header(None)
):
    """
    **PDF RAW TEXT EXTRACTOR**
    
    Upload ANY PDF and get the raw text content.
    No AI processing - just pure OCR text extraction.
    
    **Workflow:**
    1. Upload PDF to this endpoint → Get raw text
    2. Pass raw text to n8n's Gemini node → Get structured data
    3. Insert structured data to Supabase
    
    **Usage from n8n:**
    ```
    HTTP Request Node:
    - Method: POST
    - URL: http://localhost:8000/api/parse-pdf
    - Body: Binary (file upload)
    - Field name: "file"
    - Headers (optional): x-api-key: your-api-key
    ```
    
    **Example Response:**
    ```json
    {
        "success": true,
        "raw_text": "Employee Name: John Doe\\nIC: 900101-14-5678\\n...",
        "filename": "employee_form.pdf",
        "page_count": 2,
        "character_count": 1543
    }
    ```
    
    **Next Step in n8n:**
    Use Gemini node to process the raw_text into structured JSON.
    """
    # Validate API key if configured
    if API_KEY:
        validate_api_key(x_api_key)
    
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="File must be a PDF"
        )
    
    # Check LlamaParse API key
    llama_api_key = os.getenv("LLAMA_CLOUD_API_KEY")
    if not llama_api_key:
        raise HTTPException(
            status_code=500,
            detail="LLAMA_CLOUD_API_KEY not configured in .env"
        )
    
    # Save uploaded file temporarily
    temp_file = None
    try:
        # Create temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            temp_file = tmp.name
        
        # Initialize LlamaParse
        parser = LlamaParse(
            api_key=llama_api_key,
            result_type="markdown",  # Preserves structure better
            verbose=False
        )
        
        # Extract raw text
        documents = parser.load_data(temp_file)
        raw_text = "\n\n".join([doc.text for doc in documents])
        
        # Return response
        return PDFParseResponse(
            success=True,
            raw_text=raw_text,
            filename=file.filename,
            page_count=len(documents),
            character_count=len(raw_text)
        )
    
    except Exception as e:
        # Return error response
        return PDFParseResponse(
            success=False,
            error=str(e),
            filename=file.filename
        )
    
    finally:
        # Clean up temp file
        if temp_file and os.path.exists(temp_file):
            os.unlink(temp_file)


# ============================================
# HEALTH CHECK
# ============================================

@router.get("/health")
async def health_check():
    """Check if PDF parser service is ready"""
    return {
        "status": "ok",
        "service": "pdf_parser",
        "mode": "raw_text_only",
        "llama_parse_configured": bool(os.getenv("LLAMA_CLOUD_API_KEY"))
    }
