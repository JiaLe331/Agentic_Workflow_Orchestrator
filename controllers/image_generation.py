
from fastapi import APIRouter, Form, UploadFile, File, HTTPException
import io
import os
import base64
from PIL import Image
from pydantic import BaseModel
from typing import Optional

# Import the new google-genai library
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

router = APIRouter()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Initialize client if available
client = None
if genai and GOOGLE_API_KEY:
    client = genai.Client(api_key=GOOGLE_API_KEY)

class ImageGenerationResponse(BaseModel):
    success: bool
    output: Optional[str] = None # Base64 encoded string
    error: Optional[str] = None
    metadata: Optional[dict] = None

@router.post("", response_model=ImageGenerationResponse)
async def generate_image(
    prompt: str = Form(...),
    image: UploadFile = File(None)
):
    """
    Generates or edits an image using Google's Gemini 2.5 Flash (Nano Banana) model.
    Uses the new `google-genai` SDK.
    Returns JSON with base64 encoded image.
    """
    if not genai:
        raise HTTPException(status_code=500, detail="The 'google-genai' library is not installed. Please install it.")
    if not client:
        raise HTTPException(status_code=500, detail="Google GenAI client not initialized. Check GOOGLE_API_KEY.")

    try:
        model_name = "gemini-2.5-flash-image"
        
        # Prepare contents
        contents = [prompt]
        
        if image:
            image_bytes = await image.read()
            try:
                pil_image = Image.open(io.BytesIO(image_bytes))
                contents.append(pil_image)
            except Exception as e:
                return ImageGenerationResponse(success=False, error=f"Invalid image file: {str(e)}")

        # Call the model
        response = client.models.generate_content(
            model=model_name,
            contents=contents
        )
        
        # Extract response
        generated_image_bytes = None
        
        if response.candidates:
             for candidate in response.candidates:
                 if candidate.content and candidate.content.parts:
                     for part in candidate.content.parts:
                         if part.inline_data:
                             generated_image_bytes = part.inline_data.data
                             break
        
        if not generated_image_bytes:
            # Check for text fallback
            text = response.text if hasattr(response, 'text') else "No output."
            return ImageGenerationResponse(success=False, error="No image generated.", metadata={"details": text})

        # Encode to base64
        b64_image = base64.b64encode(generated_image_bytes).decode('utf-8')

        return ImageGenerationResponse(
            success=True,
            output=b64_image,
            metadata={
                "model": model_name,
                "content_type": "image/png"
            }
        )

    except Exception as e:
        return ImageGenerationResponse(success=False, error=f"GenAI Error: {str(e)}")
