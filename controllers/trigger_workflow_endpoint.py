import os
import tempfile
from fastapi import APIRouter, Request, HTTPException
import json
from services.n8n_primer_service import prime_n8n_test_execution

router = APIRouter()

@router.post("/trigger-workflow")
async def trigger_workflow_endpoint(request: Request):
    """
    Triggers an existing workflow by forwarding user inputs to its webhook URL.
    
    Accepts multipart form-data with:
      - webhook_url (required): The n8n webhook URL to trigger
      - input_requirements (required): JSON string of expected inputs
      - All other fields are treated as user inputs, matched by exact name (case-sensitive)
        e.g. "Email" = text field, "File" = file upload
    """
    from controllers.trigger_workflow_util import trigger_workflow

    form = await request.form()

    # Extract control fields
    webhook_url = form.get("webhook_url")
    input_requirements_raw = form.get("input_requirements")

    if not webhook_url:
        raise HTTPException(status_code=400, detail="webhook_url is required")
    if not input_requirements_raw:
        raise HTTPException(status_code=400, detail="input_requirements is required")

    try:
        input_requirements = json.loads(input_requirements_raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="input_requirements must be valid JSON")

    # Build user_inputs from form fields, matching input_requirements names (case-sensitive)
    user_inputs = {}
    temp_files = []

    try:
        for req in input_requirements:
            field_name = req["name"]  # Case-sensitive: "Email", "File", etc.
            field_type = req.get("type", "string")
            is_required = req.get("required", False)

            field_value = form.get(field_name)

            if field_value is None:
                if is_required:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Missing required field: '{field_name}' (type: {field_type})"
                    )
                continue

            # File types: save to temp file path
            if field_type in ["pdf", "file", "image", "spreadsheet"]:
                # field_value is an UploadFile
                upload = field_value
                suffix = os.path.splitext(upload.filename)[1] if upload.filename else ".pdf"
                temp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
                content = await upload.read()
                temp.write(content)
                temp.close()
                temp_files.append(temp.name)
                user_inputs[field_name] = temp.name
            else:
                # String/number/boolean — pass as-is
                user_inputs[field_name] = str(field_value)

        # Activate n8n workflow to listen for events
        if webhook_url:
            print(f"[Endpoint] Priming n8n test webhook: {webhook_url}")
            await prime_n8n_test_execution(webhook_url)

        # Trigger the workflow
        response = trigger_workflow(webhook_url, input_requirements, user_inputs)
        return {
            "status": "success",
            "statusCode": response.status_code,
            "response": response.text[:500]
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp files
        for path in temp_files:
            if os.path.exists(path):
                os.unlink(path)
