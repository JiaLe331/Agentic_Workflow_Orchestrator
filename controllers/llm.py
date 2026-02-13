"""
LLM Controller

FastAPI endpoints for processing text using an LLM (Gemini).
Used by n8n workflows via HTTP Request nodes.
"""

import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

# Create router
router = APIRouter()

class LLMRequest(BaseModel):
    user_input: str
    prompt: Optional[str] = None
    model: Optional[str] = "gemini-2.0-flash-001" 

class LLMResponse(BaseModel):
    success: bool
    output: str # Standardized field
    metadata: Optional[dict] = None
    error: Optional[str] = None


@router.post("/generate", response_model=LLMResponse)
async def generate_text(request: LLMRequest):
    """
    Process text using an LLM. 
    If 'prompt' is provided, it acts as the system/context instruction.
    If not, a default helpful assistant prompt is used.
    """

    try:
        # Initialize LLM
        # We use a standard model config, similar to Agent 1 but can be overridden
        llm = ChatGoogleGenerativeAI(model=request.model, temperature=0.7)

        # distinct prompt handling
        default_prompt = """
        You are a high-end AI assistant designed to produce visually stunning and highly structured responses.
        
        MANDATORY OUTPUT FORMAT:
        - **Use Markdown**: Always use H1, H2, H3 headers to structure your response.
        - **Bullet Points**: Use bullet points or numbered lists for readability.
        - **Emphasis**: Use **bold** and *italics* to highlight key information.
        - **Code Blocks**: Formats data or code snippets in appropriate code blocks.
        - **Tone**: Professional, concise, yet "impressive" and authoritative.
        
        Your goal is to make the output look like a premium report or dashboard summary.
        """
        
        system_instruction = default_prompt
        if request.prompt:
            system_instruction += f"\n\nSPECIFIC INSTRUCTION:\n{request.prompt}"
        
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", system_instruction),
            ("user", "{user_input}")
        ])

        chain = prompt_template | llm | StrOutputParser()

        response_text = await chain.ainvoke({"user_input": request.user_input})

        return LLMResponse(
            success=True, 
            output=response_text,
            metadata={"model_used": request.model}
        )

    except Exception as e:
        # raise HTTPException(status_code=500, detail=str(e)) # Keep consistent error return
        return LLMResponse(success=False, output="", error=str(e))

@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "llm",
        "model_default": "gemini-2.0-flash-001"
    }
