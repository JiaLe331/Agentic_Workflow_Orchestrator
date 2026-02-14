from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser
from agents.models import WorkflowPlan, GeneralizedWorkflow
from prompts.schema import SCHEMA_DEFINITION
import json

# Agent 2 (Planner) uses the PRO model for complex reasoning and schema validation.
llm = ChatGoogleGenerativeAI(model="gemini-3-pro-preview", temperature=0)

def plan_workflow(generalized_workflow: GeneralizedWorkflow, context_text: str = "") -> WorkflowPlan:
    """
    Agent 2: Breaks down the GeneralizedWorkflow into specific functional nodes.
    CRITICAL: Enforces foreign key resolution, UUID validation, and Schema Compliance.
    """
    
    parser = PydanticOutputParser(pydantic_object=WorkflowPlan)

    prompt = ChatPromptTemplate.from_template(
        """
        You are an ULTRA-GRANULAR Workflow Planner for a strict SQL environment.
        Your goal is to break down a request into ATOMIC, SINGLE-PURPOSE nodes.
        
        Input Context:
        {generalized_workflow}
        
        Reference Schema (DB Definition):
        {schema}

        **MANDATORY DATABASE POLICY: SUPABASE ONLY**
        - You MUST use SUPABASE for all persistence.
        - **REFER TO `docs/database.md` FOR ALL SYNTAX, FILTERING RULES, AND NODE EXAMPLES.**
        - The `database.md` file contains the STRICT rules for `eq`, `ilike`, and `getAll` filters. YOU MUST FOLLOW THEM.
        
        Examples / Context:
        {context_text}
        
        CRITICAL RULES:
        1. **DIRECT ACTION**: Simplify the workflow. Do NOT check for existence unless logic requires a branch.
        2. **ID PARSING**: Only separate if necessary.
        3. **STRICT DB COMPLIANCE**: Follow `docs/database.md` for all node parameters. 
           - **NEVER** output a `getAll` without filters unless explicitly requested.
           - **ALWAYS** Use `ilike` for names and `eq` for status/IDs.
        
        MANDATORY STRUCTURE:
        1. **START**: The first node MUST ALWAYS be `manual_trigger`.
        2. **LOGIC**: The operational nodes (fetch, create, update, etc).
        3. **END**: The last node MUST ALWAYS be `display_results`.
        
        STRICT SEQUENCE EXAMPLE (Creating a new employee):
        - Node 1: `manual_trigger`
        - Node 2: `fetch_record_by_filter` (Check duplicates or get FKs)
        - Node 3: `create_record`
        - Node 4: `display_results`
        
        **CRITICAL**: 
        - If `generalized_workflow.values` contains data, you **MUST** use it in the `data` field of the DB node.
        - **DESCRIPTION ENRICHMENT**: If `generalized_workflow.values` contains data, you **MUST** include the values in the node `description`.
          - Example: "Insert the new employee record for 'Li Jie' (IC: 030902...) into the 'employee' table."
          - Example: "Update status to 'active' for user ID 123."
        - Example: If inputs has `values={{{{'status': 'active'}}}}`, then `parameters.data` MUST be `{{{{'status': 'active'}}}}`.
        - Do NOT default to `{{input.field}}` if a specific value is provided in `generalized_workflow.values`.
        
        **EXTERNAL INPUTS (additional_inputs)**:
        - If `generalized_workflow.additional_inputs` contains values (e.g. 'whatsapp_number', 'email_subject'), you **MUST** use them in usage nodes.
        - Example: If `additional_inputs` has {{'whatsapp_number': '12345'}}, the WhatsApp node `parameters` MUST use '12345' (or map it).
        
        Output valid JSON adhering to the schema.
        
        {format_instructions}
        """
    )
    
    chain = prompt | llm | parser
    
    try:
        # Pydantic models need to be serialized for the prompt
        workflow_json = generalized_workflow.model_dump_json()
        
        result = chain.invoke({
            "generalized_workflow": workflow_json,
            "schema": SCHEMA_DEFINITION,
            "context_text": context_text,
            "format_instructions": parser.get_format_instructions()
        })
        return result
    except Exception as e:
        print(f"Error in Agent 2: {e}")
        raise e
