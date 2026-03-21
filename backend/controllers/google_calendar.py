"""
Google Calendar Controller

FastAPI endpoints to schedule meetings with Google Meet links.
Used by n8n workflows via HTTP Request nodes.
"""

import os
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Config
API_KEY = os.getenv("API_KEY", None)
GOOGLE_SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE")
GOOGLE_SERVICE_ACCOUNT_JSON = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
GOOGLE_CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID", "primary")


class MeetingRequest(BaseModel):
    summary: str
    description: Optional[str] = None
    start_time: str  # ISO 8601 e.g. 2026-02-07T10:00:00
    end_time: str
    attendees: Optional[List[str]] = []  # list of email addresses
    timezone: Optional[str] = "UTC"
    send_notifications: Optional[bool] = False
    create_conference: Optional[bool] = False


class MeetingResponse(BaseModel):
    success: bool
    event_id: Optional[str] = None
    html_link: Optional[str] = None
    meet_link: Optional[str] = None
    error: Optional[str] = None


def validate_api_key(x_api_key: Optional[str] = Header(None)):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True


def get_calendar_service():
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except Exception as e:
        raise RuntimeError("Google API libraries not installed. Add google-api-python-client and google-auth to requirements.")

    print("SERVICE ACCOUNT FILE:", GOOGLE_SERVICE_ACCOUNT_FILE)
    print("EXISTS:", os.path.exists(GOOGLE_SERVICE_ACCOUNT_FILE))

    scopes = [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events"
    ]

    creds = None
    if GOOGLE_SERVICE_ACCOUNT_FILE and os.path.exists(GOOGLE_SERVICE_ACCOUNT_FILE):
        creds = service_account.Credentials.from_service_account_file(GOOGLE_SERVICE_ACCOUNT_FILE, scopes=scopes)
    elif GOOGLE_SERVICE_ACCOUNT_JSON:
        import json
        info = json.loads(GOOGLE_SERVICE_ACCOUNT_JSON)
        creds = service_account.Credentials.from_service_account_info(info, scopes=scopes)
    else:
        raise RuntimeError("No Google service account credentials provided. Set GOOGLE_SERVICE_ACCOUNT_FILE or GOOGLE_SERVICE_ACCOUNT_JSON in .env")

    service = build("calendar", "v3", credentials=creds, cache_discovery=False)
    return service


@router.post("/create", response_model=MeetingResponse)
async def create_meeting(request: MeetingRequest, x_api_key: Optional[str] = Header(None)):
    """Create a Google Calendar event with Google Meet conference link and invite attendees."""
    if API_KEY:
        validate_api_key(x_api_key)

    # Basic validation
    try:
        start = request.start_time
        end = request.end_time
        # Ensure ISO format
        datetime.fromisoformat(start)
        datetime.fromisoformat(end)
    except Exception:
        raise HTTPException(status_code=400, detail="start_time and end_time must be valid ISO-8601 datetime strings")

    try:
        service = get_calendar_service()

        event = {
            "summary": request.summary,
            "description": request.description or "",
            "start": {"dateTime": request.start_time, "timeZone": request.timezone},
            "end": {"dateTime": request.end_time, "timeZone": request.timezone},
            "attendees": [{"email": email} for email in (request.attendees or [])],
        }

        # Only request Meet conference creation when explicitly asked
        if request.create_conference:
            event["conferenceData"] = {
                "createRequest": {
                    "requestId": str(uuid.uuid4()),
                    "conferenceSolutionKey": {"type": "hangoutsMeet"}
                }
            }

        insert_args = {
            "calendarId": GOOGLE_CALENDAR_ID,
            "body": event,
            "sendUpdates": "all" if request.send_notifications else "none"
        }

        # Only request conferenceData API when creating a Meet
        if request.create_conference:
            insert_args["conferenceDataVersion"] = 1

        created = service.events().insert(**insert_args).execute()

        meet_link = None
        conference = created.get("conferenceData", {})
        if conference:
            entry_points = conference.get("entryPoints", [])
            for ep in entry_points:
                if ep.get("entryPointType") == "video":
                    meet_link = ep.get("uri")
                    break

        return MeetingResponse(
            success=True,
            event_id=created.get("id"),
            html_link=created.get("htmlLink"),
            meet_link=meet_link
        )

    except Exception as e:
        return MeetingResponse(success=False, error=str(e))


@router.get("/health")
async def health_check():
    ok = True
    err = None
    try:
        get_calendar_service()
    except Exception as e:
        ok = False
        err = str(e)

    return {"status": "ok" if ok else "error", "service": "google_calendar", "error": err}
