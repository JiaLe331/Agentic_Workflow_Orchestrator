
import json
import uuid

def inject_webhook_node(workflow_json: str) -> str:
    """
    Deterministically adds a Webhook node to the n8n workflow JSON.
    It connects the Webhook node to the same node that the 'Manual Trigger' connects to.
    """
    try:
        data = json.loads(workflow_json)
        nodes = data.get("nodes", [])
        connections = data.get("connections", {})

        # 1. Find Manual Trigger
        manual_trigger_name = None
        target_node_connection = None
        
        for node in nodes:
            if node.get("type") == "n8n-nodes-base.manualTrigger":
                manual_trigger_name = node.get("name")
                break
        
        if not manual_trigger_name:
            # Fallback: Validation failed or no manual trigger??
            return workflow_json

        # 2. Get connection from Manual Trigger
        # n8n connections format: { "SourceNode": { "main": [[ { "node": "TargetNode", ... } ]] } }
        if manual_trigger_name in connections:
             manual_outputs = connections[manual_trigger_name].get("main", [])
             if manual_outputs and len(manual_outputs) > 0:
                 target_node_connection = manual_outputs[0] # Copy the first output list

        if not target_node_connection:
            # If manual trigger isn't connected to anything, we can't connect webhook effectively
            return workflow_json

        # 3. Create Webhook Node
        webhook_name = "Webhook"
        webhook_id = str(uuid.uuid4())
        webhook_path = f"webhook-{webhook_id[:8]}" # Unique path to avoid conflicts
        
        webhook_node = {
            "parameters": {
                "httpMethod": "POST",
                "path": webhook_path,
                "responseMode": "lastNode", 
                "options": {}
            },
            "id": webhook_id,
            "name": webhook_name,
            "type": "n8n-nodes-base.webhook",
            "typeVersion": 1,
            "position": [0, 140], 
            "webhookId": str(uuid.uuid4())
        }
        
        # Check if "Webhook" name collision exists? 
        # (Assuming Agent didn't generate one, but let's be safe)
        existing_names = [n["name"] for n in nodes]
        if webhook_name in existing_names:
            webhook_name = "Webhook_Auto"
            webhook_node["name"] = webhook_name

        nodes.append(webhook_node)

        # 4. Add Connection
        # Connect Webhook -> Same Target as Manual Trigger
        connections[webhook_name] = {
            "main": [ target_node_connection ]
        }

        # Update data
        data["nodes"] = nodes
        data["connections"] = connections
        
        return json.dumps(data, indent=2)

    except Exception as e:
        print(f"Error injecting webhook: {e}")
        return workflow_json
