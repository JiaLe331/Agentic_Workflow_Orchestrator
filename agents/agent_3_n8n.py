from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import StrOutputParser
from agents.models import WorkflowPlan
from agents.json_validator import validate_and_inject_credentials
from prompts.schema import SCHEMA_DEFINITION
from datetime import datetime
import json
import os

# Configuration
# Default to "Supabase account 3" (Retrieved ID: uY4ILzHGf3nsKJXd)
# This matches the user's preferred UI selection.
# TODO: Change based on user to user for their credential selection key on the Supabase node
# found the internal ID for "Supabase account 3"
# please refer to the notes.md
SUPABASE_CREDENTIAL_ID = os.getenv("SUPABASE_CREDENTIAL_ID", "uY4ILzHGf3nsKJXd")
API_KEY_CREDENTIAL_ID = os.getenv("API_KEY_CREDENTIAL_ID", "")

# Using a standard, available model
llm = ChatGoogleGenerativeAI(model="gemini-3-pro-preview", temperature=0)

def generate_n8n_workflow(workflow_plan: WorkflowPlan, feedback_error: str = None, previous_json: str = None, context_text: str = "") -> str:
    """
    Agent 3: Generates the actual n8n JSON code based on the WorkflowPlan.
    """
    
    # Check if we are in a Retry/Feedback Loop
    feedback_context = ""
    if feedback_error and previous_json:
        feedback_context = f"""
        WARNING: Your previous attempt failed validation.
        
        PREVIOUS JSON:
        {previous_json}
        
        VALIDATION ERROR:
        {feedback_error}
        
        GOAL: Fix the error in the previous JSON while maintaining the rest of the logic.
        """

    prompt = ChatPromptTemplate.from_template(
        """
        You are an n8n Workflow Generator. Convert the following plan into n8n JSON.
        
        {feedback_context}
        
        Workflow Plan:
        {workflow_plan}
        
        Documentation Context (USE THIS FOR NODE STRUCTURES):
        {context_text}
        
        Rules:
        1. Produce ONLY the JSON output. Do not wrap in markdown blocks like ```json ... ```.
        2. The output must follow the standard n8n JSON schema (nodes, connections).
        CRITICAL RULES FOR N8N JSON:
        1. **OPERATORS**:
           - **'status' fields**: Use 'eq' (e.g. status under 'Filters').
           - **Text fields** (name, title, etc): Use 'ilike'.
           - **Partial match**: Use 'like'.
        2. **Do NOT** include `created_at` or `updated_at` in any `fieldValues` for `create` or `update` operations.
        3. **Do NOT** output any markdown. Return raw JSON only.
        4. **Do NOT** use 'START' node. Use 'n8n-nodes-base.manualTrigger'.
        5. **Always** check `generalized_workflow.values` for explicit values.
        3. **Structure**: MUST include `nodes`, `connections`, and empty `settings` object `{{}}`.
        4. **Node Type Mapping**:
           - `manual_trigger` -> `n8n-nodes-base.manualTrigger` (trigger node).
           - `display_results` -> `n8n-nodes-base.noOp` (No Operation node, matches user preference).
           - Database Nodes -> `n8n-nodes-base.supabase` only.
        4. **Node Versions**:
           - **Supabase**: Use `"typeVersion": 1` (Compatible with user's environment).
           - **NoOp**: Use `"typeVersion": 1`.
        5. **Schema & Credentials**:
           - **Credentials**: MUST use `{{ "supabaseApi": {{ "id": "{supabase_credential_id}" }} }}`.
           - **Filters**: MUST be wrapped in a `conditions` object: `{{ "filters": {{ "conditions": [ ... ] }} }}`.
           - **Connections**: keys must be Node NAMES, not IDs.
           - **Execution Flow**: Set `"alwaysOutputData": true` for ALL nodes (to ensure flow continues even if 0 items found).
           - **Naming**: Use descriptive names (e.g., "Fetch Employee", "Create Record") instead of "node_1".
        6. **Schema Enforcement (CRITICAL)**:
           - Review the `Reference Schema`. If you are creating a record, check which columns are `NOT NULL`.
           - If the Input Plan is missing a `NOT NULL` field (e.g., year, date, nationality), you **MUST** generate a valid value for it.
           - **Dates**: Use current date (e.g. "2023-01-01") if not specified.
           - **Text**: Use "N/A" or a placeholder if not specified.
           - **Numbers**: Use 0 if not specified.
           - **UUIDs/FKs**: If a Foreign Key is required and not available, you might fail, but try to infer or use a placeholder if appropriate context exists.
           
        **DOCUMENTATION OVERRIDE**:
        - If the `Documentation Context` contains a JSON structure for a specific capability (e.g., WhatsApp, Email), you **MUST** use that structure exactly as provided.
        - **WhatsApp**: If sending via WhatsApp, use the node type and parameters defined in the context.
        
        Example Supabase Node Config (Mental Model V1 - Legacy):
        - Operation: getAll
        - Parameter "tableId": "sale"
        - Filter Structure: 
          {{
            "parameters": {{
               "tableId": "sale",
               "operation": "getAll",
               "returnAll": true,
               "filters": {{
                  "conditions": [
                     {{ "keyName": "gross_amount", "condition": "gt", "keyValue": "1000" }}
                  ]
               }}
            }}
          }}
          
        Example Display Node Config:
        {{
           "name": "Display Results",
           "type": "n8n-nodes-base.noOp",
           "typeVersion": 1,
           "parameters": {{}}
        }}
          
        Example Supabase UPDATE Node Config (Mental Model V1 - Legacy):
        - Operation: update
        - Parameter "tableId": "employee"
        - Filter (Select Row): 
          {{
            "parameters": {{
               "tableId": "employee",
               "operation": "update",
               "filters": {{
                  "conditions": [
                     {{ "keyName": "id", "condition": "eq", "keyValue": "={{ $json.id }}" }}
                  ]
               }},
               "fieldsUi": {{
                  "fieldValues": [
                     {{ "fieldId": "name", "fieldValue": "Ali Baba" }},
                     {{ "fieldId": "date_of_birth", "fieldValue": "1990-01-01" }}
                  ]
               }}
            }}
          }}

        IMPORTANT: 
        1. **Filters**: Use `keyName`, `condition`, and `keyValue`.
        2. **Operators**: Use SHORT CODES: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `ilike` (case-insensitive like), `is_not_null`, `is_null`.
           - **CRITICAL for TEXT**: ALWAYS use `ilike` for text/string comparisons (e.g. names, emails) to avoid case-sensitivity issues.
           - Example: `{{ "keyName": "name", "condition": "ilike", "keyValue": "john doe" }}`
        3. **Table**: Use `tableId`.
        4. **Values**: `keyValue` should be a string.
        5. **Update**: Do NOT use `matcherColumn`. Use `filters` to select the row to update.
        6. **Static vs Dynamic**: 
           - If the plan has exact values (e.g. "Ali Baba"), use them as **STATIC STRINGS** (e.g. `"fieldValue": "Ali Baba"`).
           - **NEVER** use `{{ $('Manual Trigger')... }}` unless the user explicitly requested a form-based workflow. (The Manual Trigger usually has no data).
        
        7. **DATE FORMATTING (CRITICAL)**:
           - You MUST use one of the following formats for dates:
             - `YYYY-MM-DD` (e.g., `2026-02-07`)
             - `YYYY-MM-DDTHH:MM:SSZ` (ISO 8601 UTC)
             - `YYYY-MM-DDTHH:MM:SS+00:00`
           - **FORBIDDEN FORMATS**: `DD-MM-YYYY`, `MM/DD/YYYY`, `Jan 1st 2023`, `tomorrow`, `today`.
           - If the plan says "today", use the current date provided below:
             Current Date: {current_date}
       
        8. **JSON Body Escaping (CRITICAL)**:
           - When constructing `jsonBody` (e.g. for Email or LLM nodes), you MUST usage `JSON.stringify()` for any dynamic string variable to ensure safe escaping of quotes and extensive content.
           - **INCORRECT**: `"html": "{{ $json.response }}"`
           - **CORRECT**: `"html": {{ JSON.stringify($json.response) }}`
        
        IMPORTANT: Do NOT include the actual sensitive credential data values in the output. 
        Just include the reference id "{supabase_credential_id}". 
        The top-level "credentials" array can be empty or omitted.
        
        Generate the n8n JSON now.
        """
    )
    
    chain = prompt | llm | StrOutputParser()
    
    try:
        n8n_json = chain.invoke({
            "workflow_plan": workflow_plan.json(),
            "schema": SCHEMA_DEFINITION,
            "feedback_context": feedback_context,
            "supabase_credential_id": SUPABASE_CREDENTIAL_ID,
            "api_key_credential_id": API_KEY_CREDENTIAL_ID,
            "current_date": datetime.now().strftime("%Y-%m-%d"),
            "context_text": context_text
        })
        
        # Cleanup markdown formatting if presential markdown wrapping
        cleaned_result = n8n_json.strip()
        if cleaned_result.startswith("```json"):
            cleaned_result = cleaned_result[7:]
        if cleaned_result.endswith("```"):
            cleaned_result = cleaned_result[:-3]
        
        # Use the validator to inject credentials
        return validate_and_inject_credentials(cleaned_result)

    except Exception as e:
        print(f"Error in Agent 3: {e}")
        raise e
