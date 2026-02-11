# Backend API Implementation Instructions

## Goal

Implement a `/generate-workflow` endpoint that accepts a text prompt and returns a generated workflow object.

## API Specification

- **Endpoint**: `POST /generate-workflow`
- **Port**: `8000`
- **Content-Type**: `application/json`

### Request Body

```json
{
  "prompt": "string" // The user's natural language request (e.g., "Create a workflow to sync employees from HR system")
}
```

### Response Body

The response should be a JSON object matching the `CreateWorkflowDto` structure used in the main API.

```json
{
  "title": "Generated Workflow Title",
  "description": "Description generated from prompt",
  "tablesInvolved": ["table1", "table2"],
  "uiType": "dashboard",
  "nodesJson": {
    "nodes": [],
    "connections": {}
  },
  "executionPlan": [
    {
      "id": "node_1",
      "function": "manual_trigger",
      "description": "Initiates the workflow...",
      "parameters": {}
    },
    {
      "id": "node_2",
      "function": "fetch_data",
      "description": "Fetches data...",
      "parameters": { "table": "table1" }
    }
  ]
}
```

## Python Implementation Guide (FastAPI Example)

> [!IMPORTANT]
> Ensure you install `fastapi`, `uvicorn`, and `pydantic`.
> `pip install fastapi uvicorn pydantic`

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    prompt: str

# Define response model based on your needs, or return dict
@app.post("/generate-workflow")
async def generate_workflow(request: GenerateRequest):
    prompt = request.prompt
    
    # TODO: CALL YOUR LLM / AGENT LOGIC HERE
    # Example logic:
    # 1. Analyze prompt
    # 2. Plan workflow
    # 3. Construct response
    
    # MOCK RESPONSE for testing
    return {
        "title": f"Workflow for: {prompt}",
        "description": "Automatically generated workflow based on user request.",
        "userPrompt": prompt, # Return the prompt
        "tablesInvolved": ["employee", "payroll"],
        "uiType": "table",
        "nodesJson": { "nodes": [], "connections": {} },
        "executionPlan": [
             {
                "id": "node_1",
                "function": "manual_trigger",
                "description": "Triggered by user update.",
                "parameters": {}
            },
            {
                "id": "node_2",
                "function": "process_data",
                "description": f"Processing logic for: {prompt}",
                "parameters": { "mode": "params" }
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Integration Notes

- The frontend expects the `executionPlan` to be an array of objects.
- Each object in `executionPlan` should optimally have:
  - `id`: unique identifier
  - `function`: name of the step/function
  - `description`: human-readable description
  - `parameters`: (optional) dictionary of parameters
- The frontend will map `function` to the Title and `description` to the details note.
