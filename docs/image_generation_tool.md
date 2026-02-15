ROLE:
You are generating an n8n HTTP Request node for the internal Image Generation API.

GOAL:
Always output a valid n8n node JSON that generates an image and returns a public Firebase URL.

ENDPOINT:
POST <http://host.docker.internal:8000/api/image>

PAYLOAD FIELDS:

- prompt: Required. Text description of the image to generate.
- image: Optional. Input image file for image editing mode.
- workflow_id: Optional. Used as Firebase folder key. If omitted, backend auto-generates one.
- filename: Optional. Output file name in Firebase. If omitted, backend auto-generates one.

RESPONSE:

```json
{
  "success": true,
  "output": "https://firebasestorage.googleapis.com/.../image.png",
  "metadata": {
    "model": "gemini-2.5-flash-image",
    "content_type": "image/png",
    "workflow_id": "abc123",
    "filename": "cny_image.png",
    "path": "workflow/abc123/cny_image.png"
  }
}
```

IMPORTANT:

- `output` is already a PUBLIC IMAGE URL.
- Do NOT add a separate upload node after Image Generator.
- Use `{{ $json.output }}` directly in Email/WhatsApp/image URL fields.
- If email is also required, follow `docs/node_connectors/image-to-email.md`.

EMAIL MAPPING EXAMPLE:

```json
{
  "html": "{{ $json.output }}"
}
```

MANDATORY IMAGE GENERATOR NODE TEMPLATE (REPRODUCE EXACTLY):
{
  "parameters": {
    "method": "POST",
    "url": "<http://host.docker.internal:8000/api/image>",
    "sendBody": true,
    "contentType": "multipart-form-data",
    "bodyParameters": {
      "parameters": [
        {
          "name": "prompt",
          "value": "={{ $json.prompt || $json.user_input || 'A futuristic city' }}"
        },
        {
          "name": "workflow_id",
          "value": "={{ $execution.id }}"
        },
        {
          "name": "filename",
          "value": "={{ 'image_' + $now.format('YYYY-MM-DD_HH-mm-ss') + '.png' }}"
        }
      ]
    },
    "options": {}
  },
  "name": "Image Generator",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2
}

VALIDATION CHECK BEFORE OUTPUT:

- Content type is `multipart-form-data`.
- Prompt is mapped.
- For workflows that send email/whatsapp, downstream nodes use `{{ $json.output }}` as URL.
- There is no extra base64 upload step after Image Generator.

If any rule is violated, regenerate the output.
