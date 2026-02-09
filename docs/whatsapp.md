# WhatsApp Integration

This documentation describes how to send WhatsApp messages using the system's WhatsApp API.

## Capability: Send WhatsApp Message

- **Action**: Send a text message to a phone number.
- **Tools**: `n8n-nodes-base.httpRequest` to calling the internal API.

## n8n Node Structure

To send a WhatsApp message, you MUST use the following JSON structure for the nodes. The `Set Test Data` node should be populated with the dynamic `to` and `message` values.

```json
{
  "nodes": [
    {
      "parameters": {
        "jsCode": "return items.map(item => {\n  // Agent 3: Replace {{to_phone_number}} with the actual column name (e.g. phone)\n  // Agent 3: Replace {{message_text}} with the message content. Use ${item.json.name} for dynamic values.\n  const phone = item.json[\"{{to_phone_number}}\"];\n  return {\n    json: {\n      to: phone ? phone.replace(/[^0-9+]/g, '') : '',\n      message: `{{message_text}}`\n    }\n  }\n});"
      },
      "name": "Set WhatsApp Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        176,
        -144
      ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "http://host.docker.internal:8000/api/whatsapp/send",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ to: $json.to, message: $json.message }) }}",
        "options": {}
      },
      "name": "Send WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        400,
        -144
      ]
    }
  ],
  "connections": {
    "Set WhatsApp Data": {
      "main": [
        [
          {
            "node": "Send WhatsApp",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Description

- **Set WhatsApp Data**: This Code node prepares the data. Replace `{{to_phone_number}}` and `{{message_text}}` with the actual values or expressions from previous nodes.
- **Send WhatsApp**: This HTTP Request node sends the payload to the local API endpoint `http://host.docker.internal:8000/api/whatsapp/send`.
  - **Note**: `host.docker.internal` is used assuming n8n is running in Docker and needs to access the host's API (this server). If running natively, `localhost` might work, but stick to the provided URL for consistency with containerized setups.
