from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser
from agents.models import GeneralizedWorkflow
from prompts.schema import SCHEMA_DEFINITION
import os

# Initialize LLM
# Note: Ensure GOOGLE_API_KEY is in .env
# Agent 1 (Intent) uses a cheaper/faster model for cost optimization.
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash-001", temperature=0)

def process_intent(user_input: str) -> GeneralizedWorkflow:
    """
    Agent 1: Takes user intent and maps it to the Supabase schema to produce a GeneralizedWorkflow.
    """
    
    parser = PydanticOutputParser(pydantic_object=GeneralizedWorkflow)

    prompt = ChatPromptTemplate.from_template(
        """
        You are an intelligent agent that maps user natural language requests to database operations.
        
        Here is the Database Schema you have access to:
        {schema}
        
        Your goal is to understand the user's intent and produce a "Generalized Workflow" description.
        
        Rules:
        1. **SCHEMA VALIDATION (DISRUPTOR)**: Check the Schema carefully. 
           - Does the requested `target_table` exist?
           - Do the requested `fields` (e.g., "age", "status") actually exist as columns in that table?
           - **CRITICAL**: If the user asks to update `age` but the table only has `date_of_birth`, you CANNOT update `age`. This is a schema violation.
           - If ANY column is missing or nonsensical, **populate `validation_error`** with "Error: Column 'X' does not exist in table 'Y'." and STOP.
        2. Identify the 'target_table' best fitting the request.
        3. Determine the 'operation' (READ, CREATE, UPDATE, DELETE).
        4. Extract 'filters'.

        5. Suggest 'ui_type' and 'data_type_display'.
        6. **GENERATE TITLE**: Create a very minimal `title` (3-5 words) that captures the core action and object. e.g. "Send Email Summary", "Parse PDF Invoice".
        7. **EXTRACT VALUES**: If the user provides specific values, you MUST extract them:
           - **DB COLUMNS**: If the value corresponds to a column in the `target_table` (e.g. "Change status to active"), put it in `values`.
           - **CRITICAL**: You MUST extract values from the user input even if they are unstructured or multi-line.
           - **MAPPING**: Map the input to any logical request based on the schema and documentation called.
             - Infer the correct column name based on the semantic meaning of the value and the table definition.
           - **EXTERNAL INPUTS**: If the value is NOT in the schema (e.g. "Send to 0123456789", "Subject: Hello"), put it in `additional_inputs`.
           - Example: "Send to whatsapp 12345" -> additional_inputs: {{ "whatsapp_number": "12345" }}
           - Example: "Email bob@example.com" -> additional_inputs: {{ "email_to": "bob@example.com", "email_subject": "Notification" }}
           
           **IDENTIFICATION RULES**:
           - **Phone Number** (Malaysia): MUST start with '01' (e.g. 012-3456789). Look for 10-11 digit numbers starting with 01.
           - **IC Number** (Malaysia): 
             - Standard: 12-digit numbers (e.g. 990101-10-5555).
             - Fallback: Any 10-12 digit number that does **NOT** start with '01' should be treated as IC if context implies identity.
             - Context: If close to "IC", "Identity", "Malaysian", prioritize as IC.
           - **Date**: Extract dates and format as YYYY-MM-DD.
        8. **SELECT DOCS**: Identify which docs are needed. Add them to 'required_docs'.
        
           **CATEGORY A: ENTITIES (Database Tables)**
           - Available: [company.md, customer.md, employee.md, onboarding.md, pay_roll.md, product.md, sale.md]
           - **RULE**: If you select ANY of these, you **MUST** also include "database.md".
           - Example: Target 'employee' -> ["employee.md", "database.md"]

           **CATEGORY B: TOOLS (External Actions)**
           - Available: [whatsapp.md, email_tool.md, llm_tool.md, pdf_reader_tool.md, upload_file_tool.md, image_generation_tool.md]
           - **WHATSAPP**: Use "whatsapp.md" for WhatsApp messages.
           - **EMAIL**: Use "email_tool.md" for sending emails.
           - **LLM/AI**: Use "llm_tool.md" for AI/Intelligence/Summarization.
           - **PDF**: Use "pdf_reader_tool.md" for parsing PDF files.
           - **UPLOAD**: Use "upload_file_tool.md" for generic file uploads.
           - **IMAGE**: Use "image_generation_tool.md" for generating or editing images.

           **CATEGORY C: CONNECTORS (Bridging Tools)**
           - Available: [node_connectors/pdf-to-llm.md, node_connectors/upload-file-to-pdf.md, node_connectors/llm-to-email.md]
           - **PDF + LLM**: If `pdf_reader_tool.md` AND `llm_tool.md` are used -> Add "node_connectors/pdf-to-llm.md".
           - **PDF UPLOAD**: If `pdf_reader_tool.md` is to be used with a file upload -> Add "node_connectors/upload-file-to-pdf.md".
           - **LLM + EMAIL**: If `llm_tool.md` AND `email_tool.md` are used -> Add "node_connectors/llm-to-email.md".

        9. **POPULATE `tables_involved`**:
           - **MUST** include ALL table names (e.g. "employee", "pay_roll").
           - **MUST** include ALL tool names (e.g. "email", "whatsapp", "llm", "pdf_parser").
           - **MIX THEM** into a single list.
           - Example: ["employee", "pay_roll", "email", "whatsapp"]
        
        Request: {user_input}
        
        {format_instructions}
        """
    )
    
    chain = prompt | llm | parser
    
    try:
        result = chain.invoke({
            "schema": SCHEMA_DEFINITION,
            "user_input": user_input,
            "format_instructions": parser.get_format_instructions()
        })
        return result
    except Exception as e:
        print(f"Error in Agent 1: {e}")
        # Return a fallback or re-raise
        raise e
