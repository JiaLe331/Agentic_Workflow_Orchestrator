ROLE:
You are generating an n8n HTTP Request node for parsing PDFs via the internal API.

GOAL:
Output the PDF Parser node. This node SHOULD be preceded by the `Adapter: File to Data` node (see `node_connectors/upload-file-to-pdf.md`).

ENDPOINT:
POST <http://host.docker.internal:8000/api/parse-pdf>

### Response

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

### Important

- The parsed text is returned in the `output` field.
- You typically map `{{ $json.output }}` to the next node.

### PDF Parser Node (HTTP Request)

```json
{
  "parameters": {
    "method": "POST",
    "url": "http://host.docker.internal:8000/api/parse-pdf",
    "sendBody": true,
    "contentType": "multipart-form-data",
    "bodyParameters": {
      "parameters": [
        {
          "name": "file",
          "parameterType": "formBinaryData",
          "inputDataFieldName": "File"
        }
      ]
    },
    "options": {}
  },
  "name": "PDF Parser",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.1
}
```

VALIDATION:

- Method is POST.
- Content Type is multipart-form-data.
- Body parameter "name" is "file".
- inputDataFieldName is "File".
