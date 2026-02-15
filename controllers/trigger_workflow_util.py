import sys
import os

# Avoid shadowing standard library 'email' module when running this script directly
if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if script_dir in sys.path:
        sys.path.remove(script_dir)

import requests
# import os # os is already imported above
import mimetypes

def trigger_workflow(webhook_url: str, input_requirements: list, user_inputs: dict):
    """
    Triggers a workflow via webhook using the provided input requirements and user inputs.
    
    Args:
        webhook_url (str): The URL of the n8n webhook (Test or Production).
        input_requirements (list): List of dicts defining required inputs (name, type, required).
        user_inputs (dict): Dictionary of values provided by the user/system. 
                            For files, expecting a file path string.
                            
    Returns:
        Response object from requests.post
    
    Raises:
        ValueError: If required inputs are missing.
        FileNotFoundError: If a required file path does not exist.
    """
    
    files = {}
    data = {}
    
    print(f"🔄 Preparing Trigger for: {webhook_url}")
    
    for req in input_requirements:
        field_name = req["name"]
        field_type = req["type"]
        is_required = req.get("required", False)
        
        # 1. Validation
        if is_required and field_name not in user_inputs:
            raise ValueError(f"Missing mandatory input: '{field_name}' (Type: {field_type})")
            
        value = user_inputs.get(field_name)
        if value is None:
            continue # Skip if optional and missing
            
        # 2. Processing
        if field_type in ["pdf", "spreadsheet", "image", "file"]:
            # Handle File
            file_path = value
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File input '{field_name}' not found at path: {file_path}")
                
            # Guess MIME type
            mime_type, _ = mimetypes.guess_type(file_path)
            if not mime_type:
                mime_type = "application/octet-stream"
                
            # Open file (Caller must handle closing or we read binary content now)
            # Using open directly here implies we close it, but requests uses it.
            # Convert to tuple for requests
            f = open(file_path, "rb")
            files[field_name] = (os.path.basename(file_path), f, mime_type)
            print(f"  > [File] Added '{field_name}' from {file_path}")
            
        else:
            # Handle Data Field
            data[field_name] = value
            print(f"  > [Data] Added '{field_name}': {value}")

    # 3. Sending Request
    try:
        if files:
            response = requests.post(webhook_url, files=files, data=data)
            # Close files
            for _, f_tuple in files.items():
                f_tuple[1].close()
        else:
            response = requests.post(webhook_url, json=data) # Send JSON if no files
            
        print(f"✅ Response ({response.status_code}): {response.text[:200]}...")
        return response

    except Exception as e:
        print(f"❌ POST Request Failed: {e}")
        # Close files in case of error
        for _, f_tuple in files.items():
            f_tuple[1].close()
        raise e

if __name__ == "__main__":
    # Test Usage
    mock_url = "http://localhost:5678/webhook-test/process-doc"
    mock_reqs = [
        {"name": "Email", "type": "string", "required": True},
        {"name": "file", "type": "pdf", "required": True}
    ]
    mock_inputs = {
        "Email": "test@example.com",
        "file": "test/Permulab_12Feb.pdf" # Ensure this exists
    }
    
    # Create dummy pdf if needed
    if not os.path.exists(mock_inputs["file"]):
        with open(mock_inputs["file"], "wb") as f: f.write(b"%PDF-1.0...")
        
    try:
        trigger_workflow(mock_url, mock_reqs, mock_inputs)
    except Exception as e:
        print(f"Test Error: {e}")
