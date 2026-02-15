ROLE:
You are generating the CORE INPUT BLOCK for every n8n workflow.
This document is MANDATORY reading. Every workflow MUST start with this pattern.

---

## RULE: EVERY WORKFLOW STARTS WITH A WEBHOOK

ALL workflows, regardless of whether they need user input or not, MUST start with a Webhook node (POST method).

---

## CASE 1: WORKFLOW WITH USER INPUT (is_recyclable = True)

If the workflow requires user input (file upload, email address, any dynamic field), you MUST use this EXACT 3-node sequence BEFORE any logic nodes:

### Node 1: Webhook (POST)

Accepts ALL input via the POST body. Files are sent as binary multipart, text fields as JSON body.

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
  "position": [250, 300],
  "webhookId": "GENERATE_UNIQUE_UUID",
  "onError": "continueErrorOutput"
}
```

### Node 2: Extract PDF Text (ONLY if input includes a PDF file)

If the user is uploading a PDF, you MUST extract the text from the binary.

```json
{
  "parameters": {
    "operation": "pdf",
    "binaryPropertyName": "file",
    "options": {}
  },
  "name": "Extract PDF Text",
  "type": "n8n-nodes-base.extractFromFile",
  "typeVersion": 1,
  "position": [470, 300]
}
```

**SKIP this node if no file input is required.**

### Node 3: Data Splitter (Set Node)

Maps ALL webhook body fields + extracted content into clean variables for downstream nodes.

```json
{
  "parameters": {
    "assignments": {
      "assignments": [
        {
          "id": "assign-email",
          "name": "userEmail",
          "value": "={{ $node[\"Webhook\"].json.body.Email }}",
          "type": "string"
        },
        {
          "id": "assign-content",
          "name": "pdfContent",
          "value": "={{ $json.text }}",
          "type": "string"
        }
      ]
    },
    "options": {}
  },
  "name": "Data Splitter",
  "type": "n8n-nodes-base.set",
  "typeVersion": 3.4,
  "position": [690, 300]
}
```

**RULES for Data Splitter assignments:**

- For EACH input the user provides, create one assignment.
- Reference text fields from the webhook body: `={{ $node["Webhook"].json.body.FieldName }}`
- Reference extracted PDF text: `={{ $json.text }}`
- Use descriptive variable names: `userEmail`, `pdfContent`, `employeeId`, etc.

### Wiring (With File Input)

```
Webhook → Extract PDF Text → Data Splitter → [Logic Nodes] → Display Results
```

### Wiring (Without File Input, but with other dynamic fields)

```
Webhook → Data Splitter → [Logic Nodes] → Display Results
```

(Skip the Extract PDF node entirely.)

---

## CASE 2: WORKFLOW WITHOUT USER INPUT (is_recyclable = False)

Use a simple Webhook with no expected body. Connect directly to the first logic node.

```json
{
  "parameters": {
    "httpMethod": "POST",
    "options": {}
  },
  "name": "Webhook",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1,
  "position": [250, 300],
  "webhookId": "GENERATE_UNIQUE_UUID"
}
```

### Wiring

```
Webhook → [Logic Nodes] → Display Results
```

---

## BANNED PATTERNS

- **NEVER** use `n8n-nodes-base.formTrigger`. It is deprecated and does not support webhook invocation.
- **NEVER** use `n8n-nodes-base.manualTrigger` as the primary trigger. Always use Webhook.
- **NEVER** use an "Adapter: File to Data" code node to rename binary properties. The `extractFromFile` node handles this directly.

---

## input_requirements OUTPUT

Agent 2 MUST output `input_requirements` — a list describing what the user must provide at runtime:

```json
[
  {"name": "file", "type": "pdf", "required": true},
  {"name": "Email", "type": "string", "required": true}
]
```

Supported types: `"string"`, `"number"`, `"boolean"`, `"pdf"`

If `is_recyclable` is False, `input_requirements` should be an empty list `[]`.
