from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# --- Agent 0 Models ---

class SafetyGuardResponse(BaseModel):
    """
    Output from the Safety Guard Agent.
    """
    is_safe: bool = Field(..., description="True if the user request is safe to process, False otherwise.")
    reason: Optional[str] = Field(None, description="Explanation why the request is unsafe (if applicable).")

# --- Agent 1 Models ---

class GeneralizedWorkflow(BaseModel):
    """
    Represents the user's high-level intent mapped to the schema.
    """
    intent: str = Field(..., description="A concise summary of what the user wants to achieve.")
    title: str = Field(..., description="A very minimal title (3-5 words) for the workflow. e.g. 'Parse PDF Invoice', 'Send Email Summary'.")
    target_table: Optional[str] = Field(None, description="The primary database table involved, if any.")
    operation: str = Field(..., description="The type of operation: e.g., 'READ', 'CREATE', 'UPDATE', 'DELETE', 'ANALYZE'.")
    fields: List[str] = Field(default_factory=list, description="List of specific fields or columns involved.")
    filters: Dict[str, Any] = Field(default_factory=dict, description="Key-value pairs for filtering data.")
    ui_type: Optional[str] = Field(None, description="Suggested UI representation: 'table', 'chart', 'form', 'text'.")
    data_type_display: Optional[str] = Field(None, description="Data type for display: 'decimal', 'number', 'category', 'text'.")
    validation_error: Optional[str] = Field(None, description="If the request violates the schema (e.g., column absent), populate this error message to STOP the workflow.")
    values: Dict[str, Any] = Field(default_factory=dict, description="Explicit values to be used for CREATE or UPDATE operations (e.g. {'status': 'active'}). extract from user query.")
    additional_inputs: Dict[str, Any] = Field(default_factory=dict, description="Values provided by the user that are NOT filters or DB columns (e.g., 'destination_phone', 'alert_threshold', 'email_subject').")
    required_docs: List[str] = Field(default_factory=list, description="List of documentation filenames required for this context (e.g. ['employee.md', 'pay_roll.md']).")
    tables_involved: List[str] = Field(default_factory=list, description="List of ALL tables (entities) and TOOLS involved. e.g. ['employee', 'salary', 'email_tool', 'whatsapp'].")
    is_recyclable: bool = Field(default=False, description="True if the workflow is designed to be reused with different inputs (e.g. file upload, form submission). False for one-off tasks.")


# --- Agent 2 Models ---

class WorkflowNode(BaseModel):
    """
    A single step in the functional workflow.
    """
    id: str = Field(..., description="Unique identifier for the node.")
    function: str = Field(..., description="The logic or function this node performs (e.g., 'fetch_data', 'filter', 'generate_ui').")
    description: str = Field(..., description="Human-readable explanation of what this node does.")
    inputs: List[str] = Field(default_factory=list, description="IDs of nodes or data sources this node depends on.")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Configuration parameters for the function.")

class WorkflowPlan(BaseModel):
    """
    The complete sequence of nodes to execute the user's intent.
    """
    nodes: List[WorkflowNode]
    input_requirements: List[Dict[str, Any]] = Field(default_factory=list, description="List of required inputs for the workflow. E.g. [{'name': 'file', 'type': 'pdf', 'required': True}]")
