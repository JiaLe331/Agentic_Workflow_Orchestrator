import json
import os
from typing import Dict, Any

def validate_and_inject_credentials(n8n_json_str: str) -> str:
    """
    Validates the n8n JSON structure, fixes common schema issues (filters),
    and injects Supabase credentials from environment variables.
    
    Args:
        n8n_json_str (str): The raw JSON string representing the n8n workflow.
        
    Returns:
        str: The validated and enriched JSON string.
    """
    try:
        workflow_data = json.loads(n8n_json_str.strip())
        
        nodes = workflow_data.get("nodes", [])
        for node in nodes:
            if node.get("type") == "n8n-nodes-base.supabase":
                params = node.get("parameters", {})
                filters = params.get("filters", {})
                conditions = filters.get("conditions", [])

                # --- Fix 1: Legacy V1 Schema Enforcement (keyName, condition, keyValue) ---
                # User requires: keyName, condition (eq, gt), keyValue
                
                if isinstance(conditions, list):
                    for cond in conditions:
                        # 1. Field Name Normalization
                        if "column" in cond:
                            cond["keyName"] = cond.pop("column")
                        if "key" in cond:
                            cond["keyName"] = cond.pop("key")
                            
                        # 2. Value Field Normalization
                        if "value" in cond:
                            cond["keyValue"] = str(cond.pop("value")) # Ensure string
                        if "keyValue" in cond:
                            cond["keyValue"] = str(cond["keyValue"])

                        # 3. Operator/Condition Normalization
                        if "operator" in cond:
                            cond["condition"] = cond.pop("operator")
                            
                        # 4. Map Long Operators to Short Codes (eq, gt, etc)
                        op = cond.get("condition")
                        op_map = {
                            "equal": "eq",
                            "notEqual": "neq",
                            "greaterThan": "gt", 
                            "lessThan": "lt",
                            "greaterThanOrEqual": "gte",
                            "lessThanOrEqual": "lte",
                            ">": "gt",
                            "<": "lt",
                            "=": "eq"
                        }
                        if op in op_map:
                            cond["condition"] = op_map[op]
                
                # --- Fix 3: Schema Updates (V1 Sensitivity) ---
                # We do NOT force tableId -> table anymore because user uses V1 which requires tableId.
                # We do NOT force typeVersion -> 2 anymore because user environment seems to lack V2 support.

        # Note: We do NOT inject credentials data here. 
        # Credentials should be managed in n8n and referenced by ID.
        # Leaking secrets in the JSON export is a security risk.
        
        # Security: Explicitly remove any top-level 'credentials' block that might have been generated
        workflow_data.pop("credentials", None)

        # Return the modified JSON string
        return json.dumps(workflow_data, indent=2)
        
    except json.JSONDecodeError:
        print("Failed to parse LLM output as JSON. Returning raw output.")
        return n8n_json_str.strip()
    except Exception as e:
        print(f"Error during JSON validation: {e}")
        # In case of other errors, return the original string to avoid breaking everything
        return n8n_json_str.strip()
