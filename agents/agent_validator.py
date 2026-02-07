import json
import re

def validate_n8n_workflow(n8n_json_str: str, schema_definition: str = "") -> bool:
    """
    Validates the generated n8n workflow JSON against strict rules.
    Returns True if valid, raises Exception if critical violation found.
    """
    try:
        workflow = json.loads(n8n_json_str)
    except json.JSONDecodeError as e:
        raise Exception(f"Invalid JSON format: {e}")

    nodes = workflow.get("nodes", [])
    
    for node in nodes:
        node_type = node.get("type", "")
        parameters = node.get("parameters", {})
        
        # Rule 1: Text Comparison Rule (ilike)
        if node_type == "n8n-nodes-base.supabase":
            filters = parameters.get("filters", {}).get("conditions", [])
            table_id = parameters.get("tableId", "")
            
            for condition in filters:
                # Heuristic: if value looks like a string and not a UUID/Date/Number
                # This is a bit loose, ideally we check schema types.
                # But user rule is "All text... comparisons MUST use ilike"
                cond_operator = condition.get("condition")
                key_name = condition.get("keyName", "")
                
                # List of likely text fields
                text_fields = ["name", "email", "description", "title", "role", "colour", "item_name", "country_origin", "nationality", "industry"]
                
                # Rule 1: Comparison Operator Rules
                # - 'status' -> eq
                # - 'text' -> ilike
                
                if key_name == "status":
                    if cond_operator != "eq":
                         raise Exception(f"Rule Violation: 'status' field must use 'eq' operator, found '{cond_operator}'.")
                
                elif key_name in text_fields:
                    # Default text fields should use ilike
                    if cond_operator == "eq":
                        raise Exception(f"Rule Violation: Text comparison for '{key_name}' must use 'ilike', found 'eq'. Use 'ilike' for case-insensitive matching.")

        # Rule 2: Timestamp Exclusion Rule
        if node_type == "n8n-nodes-base.supabase" and parameters.get("operation") in ["create", "update"]:
            fields_ui = parameters.get("fieldsUi", {}).get("fieldValues", [])
            for field in fields_ui:
                field_id = field.get("fieldId")
                if field_id in ["created_at", "updated_at"]:
                    raise Exception(f"Rule Violation: 'created_at' or 'updated_at' MUST NOT be included in write operations.")

        # Rule 3: No "Undefined" String
        # deeply traverse the node to find "Undefined"
        node_str = json.dumps(node)
        if '"Undefined"' in node_str or "'Undefined'" in node_str:
             raise Exception("Rule Violation: Found 'Undefined' string in values. Use null instead.")

        # Rule 4: NotNull Constraint (Critical Disruptor)
        # We need to know which fields are NOT NULL.
        # This is hard without parsing the DDL dynamically.
        # However, for 'employee' table, we know 'name', 'ic', 'date_of_birth' are NOT NULL.
        if node_type == "n8n-nodes-base.supabase" and parameters.get("operation") == "create" and parameters.get("tableId") == "employee":
             fields = [f.get("fieldId") for f in parameters.get("fieldsUi", {}).get("fieldValues", [])]
             mandatory = ["name", "ic", "date_of_birth"]
             missing = [m for m in mandatory if m not in fields]
             if missing:
                 # USER RULE: "do not violate notNull constraint, end the system... mentioned why... and just disrupt"
                 raise CriticalValidationFailure(f"CRITICAL: Missing mandatory fields {missing} for table 'employee'.")

    return True

class CriticalValidationFailure(Exception):
    """Exception raised for unrecoverable validation errors (e.g. NotNull violation)."""
    pass
