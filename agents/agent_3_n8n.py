from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import StrOutputParser
from agents.models import WorkflowPlan
from agents.json_validator import validate_and_inject_credentials
import json

# Using a standard, available model
llm = ChatGoogleGenerativeAI(model="gemini-3-pro-preview", temperature=0)

def generate_n8n_workflow(workflow_plan: WorkflowPlan) -> str:
    """
    Agent 3: Converts the WorkflowPlan into an n8n workflow JSON structure.
    """
    
    prompt = ChatPromptTemplate.from_template(
        """
        You are an n8n Workflow Specialist.
        Your goal is to convert a high-level execution plan into a VALID n8n workflow JSON.
        
        Input Plan:
        {workflow_plan}
        
        Rules:
        1. Produce ONLY the JSON output. Do not wrap in markdown blocks like ```json ... ```.
        2. The output must follow the standard n8n JSON schema (nodes, connections).
        3. **Node Type Mapping**:
           - `manual_trigger` -> `n8n-nodes-base.manualTrigger` (trigger node).
           - `display_results` -> `n8n-nodes-base.noOp` (No Operation node, matches user preference).
           - Database Nodes -> `n8n-nodes-base.supabase`.
        4. **Node Versions**:
           - **Supabase**: Use `"typeVersion": 1` (Compatible with user's environment).
           - **NoOp**: Use `"typeVersion": 1`.
        5. **Schema & Credentials**:
           - **Credentials**: MUST use `{{ "supabaseApi": {{ "id": "supabase_prod_credentials" }} }}`.
           - **Filters**: MUST be wrapped in a `conditions` object: `{{ "filters": {{ "conditions": [ ... ] }} }}`.
           - **Connections**: keys must be Node NAMES, not IDs.
        
        Example Supabase Node Config (Mental Model V1 - Legacy):
        - Operation: getAll
        - Parameter "tableId": "invoice"
        - Filter Structure: 
          {{
            "parameters": {{
               "tableId": "invoice",
               "operation": "getAll",
               "returnAll": true,
               "filters": {{
                  "conditions": [
                     {{ "keyName": "status", "condition": "eq", "keyValue": "paid" }},
                     {{ "keyName": "total_amount", "condition": "gt", "keyValue": "1000" }}
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
        - Parameter "tableId": "person"
        - Filter (Select Row): 
          {{
            "parameters": {{
               "tableId": "person",
               "operation": "update",
               "filters": {{
                  "conditions": [
                     {{ "keyName": "id", "condition": "eq", "keyValue": "={{ $json.id }}" }}
                  ]
               }},
               "fieldsUi": {{
                  "fieldValues": [
                     {{ "fieldId": "full_name", "fieldValue": "Li Jia" }},
                     {{ "fieldId": "date_of_birth", "fieldValue": "50" }}
                  ]
               }}
            }}
          }}

        IMPORTANT: 
        1. **Filters**: Use `keyName`, `condition`, and `keyValue`.
        2. **Operators**: Use SHORT CODES: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`.
        3. **Table**: Use `tableId`.
        4. **Values**: `keyValue` should be a string.
        5. **Update**: Do NOT use `matcherColumn`. Use `filters` to select the row to update.
        6. **Static vs Dynamic**: 
           - If the plan has exact values (e.g. "Li Jia"), use them as **STATIC STRINGS** (e.g. `"fieldValue": "Li Jia"`).
           - **NEVER** use `{{ $('Manual Trigger')... }}` unless the user explicitly requested a form-based workflow. (The Manual Trigger usually has no data).
        
        IMPORTANT: Do NOT include the actual sensitive credential data values in the output. 
        Just include the reference id "supabase_prod_credentials". 
        The top-level "credentials" array can be empty or omitted.
        
        Generate the n8n JSON now.
        """
    )
    
    chain = prompt | llm | StrOutputParser()
    
    try:
        # Pydantic models need to be serialized for the prompt
        plan_json = workflow_plan.model_dump_json()
        
        result = chain.invoke({
            "workflow_plan": plan_json
        })
        
        # Clean up potential markdown wrapping
        cleaned_result = result.strip()
        if cleaned_result.startswith("```json"):
            cleaned_result = cleaned_result[7:]
        if cleaned_result.endswith("```"):
            cleaned_result = cleaned_result[:-3]
        
        # Use the validator to inject credentials
        return validate_and_inject_credentials(cleaned_result)

    except Exception as e:
        print(f"Error in Agent 3: {e}")
        raise e
