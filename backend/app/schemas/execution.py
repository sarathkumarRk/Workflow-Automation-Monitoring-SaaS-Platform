from pydantic import BaseModel
from typing import Any


class ExecutionCreate(BaseModel):
    input_data: dict[str, Any] = {}


class ExecutionResponse(BaseModel):
    id: int
    workflow_id: int
    status: str
    input_data: dict[str, Any] | None = None
    output_data: dict[str, Any] | None = None
    error_message: str | None = None

    model_config = {"from_attributes": True}