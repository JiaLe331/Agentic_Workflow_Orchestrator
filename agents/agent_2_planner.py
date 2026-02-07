from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser
from agents.models import WorkflowPlan, GeneralizedWorkflow
from agents.schema import SCHEMA_DEFINITION
import json

# Agent 2 (Planner) uses the PRO model for complex reasoning and schema validation.
llm = ChatGoogleGenerativeAI(model="gemini-3-pro-preview", temperature=0)

def plan_workflow(generalized_workflow: GeneralizedWorkflow) -> WorkflowPlan:
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
        
        CRITICAL RULES:
        1. **DIRECT ACTION**: Simplify the workflow. Do NOT check for existence unless logic requires a branch.
        2. **ID PARSING**: Only separate if necessary.
        3. **SCHEMA COMPLIANCE**: 
           - Reference the Schema for every DB operation.
           - For `CREATE` (Insert): You MUST include ALL `NOT NULL` columns in the `parameters` -> `data` object.
           - For `UPDATE`: Identify the row using a Unique Constraint or PK in `filters`.
        
        MANDATORY STRUCTURE:
        1. **START**: The first node MUST ALWAYS be `manual_trigger`.
        2. **LOGIC**: The operational nodes (fetch, create, update, etc).
        3. **END**: The last node MUST ALWAYS be `display_results`.
        
        STRICT SEQUENCE EXAMPLE (Creating a new employee):
        - Node 1: `manual_trigger`
        - Node 2: `fetch_record_by_filter` (Check duplicates or get FKs)
        - Node 3: `create_record`
        - Node 4: `display_results`
        
        FOREIGN KEY RULES:
        - NEVER reference an entity without its UUID.
        - If you need a Company ID, you must Fetch -> Validate -> Use.
        
        PARAMETER STRUCTURE (for DB nodes):
        When generating a node for Database interactions, the 'parameters' dictionary MUST include a 'query_spec' with:
        - `table`: "table_name"
        - `operation`: "select" | "insert" | "update" | "delete"
        - `columns`: ["field1", "field2"] (for select)
        - `filters`: {{ "column_name": "value" }} (For SELECT/UPDATE)
        - `filters`: {{ "column_name": "value" }} (For SELECT/UPDATE)
        - `data`: {{ "column_name": "value" }} (For INSERT/UPDATE. Must cover all NOT NULL fields!)
        
        **CRITICAL**: 
        - If `generalized_workflow.values` contains data, you **MUST** use it in the `data` field of the DB node.
        - Example: If inputs has `values={{{{'status': 'active'}}}}`, then `parameters.data` MUST be `{{{{'status': 'active'}}}}`.
        - Do NOT default to `{{input.field}}` if a specific value is provided in `generalized_workflow.values`.
        
        Example Parameter Output:
        {{
          "query_spec": {{
             "table": "users",
             "operation": "update",
             "filters": {{ "id": "uuid-1234" }},
             "data": {{ "role": "admin" }}
          }}
        }}
        
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
            "format_instructions": parser.get_format_instructions()
        })
        return result
    except Exception as e:
        print(f"Error in Agent 2: {e}")
        raise e
