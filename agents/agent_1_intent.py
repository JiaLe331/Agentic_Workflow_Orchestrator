from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser
from agents.models import GeneralizedWorkflow
from agents.schema import SCHEMA_DEFINITION
import os

# Initialize LLM
# Note: Ensure GOOGLE_API_KEY is in .env
llm = ChatGoogleGenerativeAI(model="gemini-3-pro-preview", temperature=0)

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
