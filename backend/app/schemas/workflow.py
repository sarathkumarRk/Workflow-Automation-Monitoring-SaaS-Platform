from pydantic import BaseModel
from typing import Any


class WorkflowCreate(BaseModel):
    name: str
    description: str | None = None
    is_enabled: bool = True


class WorkflowResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: str | None = None
    is_enabled: bool

    model_config = {"from_attributes": True}


class TriggerCreate(BaseModel):
    trigger_type: str
    config: dict[str, Any] = {}


class ConditionCreate(BaseModel):
    field: str
    operator: str
    value: Any


class ActionCreate(BaseModel):
    action_type: str
    config: dict[str, Any] = {}