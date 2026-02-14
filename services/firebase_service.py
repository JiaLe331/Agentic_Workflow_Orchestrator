import os
import pyrebase
from dotenv import load_dotenv
import shutil

load_dotenv()

# Initialize Firebase
firebase_config = {
    "apiKey": os.getenv("FIREBASE_API_KEY"),
    "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
    "projectId": os.getenv("FIREBASE_PROJECT_ID"),
    "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
    "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
    "appId": os.getenv("FIREBASE_APP_ID"),
    "measurementId": os.getenv("FIREBASE_MEASUREMENT_ID"),
    "databaseURL": "" # Required by pyrebase4 even if not using Realtime Database
}


# Global storage instance
storage = None
_init_error = None

def initialize_firebase():
    """
    Initializes the Firebase App and Storage instance.
    Idempotent: does nothing if already initialized.
    """
    global storage, _init_error
    
    if storage is not None:
        return

    try:
        firebase = pyrebase.initialize_app(firebase_config)
        storage = firebase.storage()
        print("[Firebase] Initialized successfully.")
    except Exception as e:
        _init_error = str(e)
        print(f"[Firebase] Initialization Failed: {e}")
        storage = None


def upload_file_to_firebase(file_path: str, workflow_id: str, destination_filename: str) -> str:
    """
    Uploads a file to Firebase Storage under the path: workflow/{workflow_id}/{destination_filename}
    Returns the public URL (if available) or the storage path.
    """
    global storage
    if storage is None:
        initialize_firebase()

    if not storage:
        raise Exception(f"Firebase Storage not initialized. Init Error: {_init_error}")

    # Define the storage path
    # User requested: "workflow/workflowId/imageUrl" (interpreted as the file path)
    storage_path = f"workflow/{workflow_id}/{destination_filename}"

    print(f"[Firebase] Uploading {file_path} to {storage_path}...")
    
    try:
        # put() takes the local file path
        # It returns a dictionary with metadata.
        result = storage.child(storage_path).put(file_path)
        
        # Helper to get the download URL
        # pyrebase 'put' result usually contains 'downloadTokens'
        # We can construct the URL manually or use storage.child(path).get_url(token)
        
        # For public buckets simply:
        url = storage.child(storage_path).get_url(None)
        
        print(f"[Firebase] Upload Success. URL: {url}")
        return url
    except Exception as e:
        print(f"[Firebase] Upload Failed: {e}")
        raise e
