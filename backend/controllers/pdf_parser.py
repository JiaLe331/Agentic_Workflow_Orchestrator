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

# ============================================
# RESPONSE MODEL
# ============================================

class PDFParseResponse(BaseModel):
    """Response model for PDF parsing"""
    success: bool
    output: Optional[str] = None  # Standardized field for main content
    error: Optional[str] = None
    metadata: Optional[dict] = None # For page_count, filename, etc.


# ============================================
# HELPER FUNCTION
# ============================================



# ============================================
# RAW TEXT EXTRACTION ENDPOINT
# ============================================

@router.post("/parse-pdf", response_model=PDFParseResponse)
async def parse_pdf_raw_text(
    file: UploadFile = File(...)
):
    """
    **PDF RAW TEXT EXTRACTOR**
    
    Standardized API response:
    ```json
    {
        "success": true,
        "output": "Extracted text content...",
        "metadata": {
            "filename": "file.pdf",
            "page_count": 5
        }
    }
    ```
    """
    # Validate API key if configured
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
            output=raw_text,
            metadata={
                "filename": file.filename,
                "page_count": len(documents),
                "character_count": len(raw_text)
            }
        )
    
    except Exception as e:
        # Return error response
        return PDFParseResponse(
            success=False,
            error=str(e),
            metadata={"filename": file.filename}
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
