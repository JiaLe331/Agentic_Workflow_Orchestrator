from fastapi import APIRouter, UploadFile, HTTPException, Depends, File, Form
from pydantic import BaseModel
import shutil
import os
import uuid
from services.firebase_service import upload_file_to_firebase

router = APIRouter()

TEMP_UPLOAD_DIR = "/tmp/uploads"
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

class UploadResponse(BaseModel):
    workflow_id: str
    file_url: str
    path: str

@router.post("/upload", response_model=UploadResponse)
async def upload_image(
    workflow_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Handle file upload to Firebase Storage.
    Expects multi-part form data with 'workflow_id' and 'file'.
    Saves the file to 'workflow/{workflow_id}/{filename}'.
    """
    try:
        # 1. Save uploaded file to temp location
        file_extension = os.path.splitext(file.filename)[1]
        temp_filename = f"{uuid.uuid4()}{file_extension}"
        temp_file_path = os.path.join(TEMP_UPLOAD_DIR, temp_filename)
        
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"[Upload] Saved temp file to {temp_file_path}")
        
        # 2. Upload to Firebase
        # We use the original filename as the destination filename (or could use uuid)
        # Assuming user's "directory workflow/workflowId/imageUrl" implies filename matters.
        # But if imageUrl is the directory, maybe filename is implied.
        destination_filename = file.filename
        
        # Call the service function
        file_url = upload_file_to_firebase(temp_file_path, workflow_id, destination_filename)
        
        # 3. Cleanup
        os.remove(temp_file_path)
        
        return UploadResponse(
            workflow_id=workflow_id,
            file_url=file_url,
            path=f"workflow/{workflow_id}/{destination_filename}"
        )

    except Exception as e:
        print(f"[Upload] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
