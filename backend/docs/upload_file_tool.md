ROLE:
You are generating the file upload handling for an n8n workflow.

GOAL:
Accept file uploads via a Webhook POST request. Files are sent as binary multipart data.

IMPORTANT: The old `formTrigger` approach is DEPRECATED. Always use the Webhook node.

TRIGGER NODE (Webhook):
Use the n8n Webhook node to accept file uploads via POST.

MANDATORY TRIGGER TEMPLATE:

```json
{
  "parameters": {
    "httpMethod": "POST",
    "options": {
      "rawBody": false
    }
  },
  "name": "Webhook",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1,
  "onError": "continueErrorOutput"
}
```

AFTER WEBHOOK — EXTRACT FILE:
If the user uploads a PDF file, use `extractFromFile` to get the text content:

```json
{
  "parameters": {
    "operation": "pdf",
    "binaryPropertyName": "file",
    "options": {}
  },
  "name": "Extract PDF Text",
  "type": "n8n-nodes-base.extractFromFile",
  "typeVersion": 1
}
```

VALIDATION CHECK:

- Type is `n8n-nodes-base.webhook` (NOT `formTrigger`).
- File extraction uses `extractFromFile`.
- NEVER use `formTrigger`. It is deprecated.
