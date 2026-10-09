
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.workflow import Workflow
from app.models.workflow_execution import WorkflowExecution
from app.models.execution_step_log import ExecutionStepLog
from app.dependencies import get_current_user
from app.schemas.execution import ExecutionResponse
from app.services.workflow_engine import execute_workflow


router = APIRouter(
    prefix="/executions",
    tags=["Executions"],
)


# Get Execution History
@router.get("/", response_model=list[ExecutionResponse])
def get_executions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    workflow_id: int | None = Query(None, gt=0),
    execution_status: str | None = Query(
        None,
        alias="status",
        pattern="^(PENDING|RUNNING|SUCCESS|FAILED)$",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(WorkflowExecution)
        .join(
            Workflow,
            Workflow.id == WorkflowExecution.workflow_id,
        )
        .filter(Workflow.user_id == current_user.id)
    )

    if workflow_id is not None:
        query = query.filter(
            WorkflowExecution.workflow_id == workflow_id
        )

    if execution_status:
        query = query.filter(
            WorkflowExecution.status == execution_status
        )

    return (
        query
        .order_by(WorkflowExecution.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )


# Get Execution Details with Step Logs
@router.get("/{execution_id}")
def get_execution(
    execution_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    execution = (
        db.query(WorkflowExecution)
        .join(
            Workflow,
            Workflow.id == WorkflowExecution.workflow_id,
        )
        .filter(
            WorkflowExecution.id == execution_id,
            Workflow.user_id == current_user.id,
        )
        .first()
    )

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found",
        )

    logs = (
        db.query(ExecutionStepLog)
        .filter(
            ExecutionStepLog.execution_id == execution.id
        )
        .order_by(ExecutionStepLog.created_at.asc())
        .all()
    )

    return {
        "execution": execution,
        "step_logs": logs,
    }


# Retry Failed Execution
@router.post(
    "/{execution_id}/retry",
    response_model=ExecutionResponse,
    status_code=status.HTTP_201_CREATED,
)
def retry_execution(
    execution_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find the original execution belonging to this user
    original = (
        db.query(WorkflowExecution)
        .join(
            Workflow,
            Workflow.id == WorkflowExecution.workflow_id,
        )
        .filter(
            WorkflowExecution.id == execution_id,
            Workflow.user_id == current_user.id,
        )
        .first()
    )

    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found",
        )

    if original.status != "FAILED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only failed executions can be retried",
        )

    # Check that the workflow is still enabled
    workflow = (
        db.query(Workflow)
        .filter(
            Workflow.id == original.workflow_id,
            Workflow.user_id == current_user.id,
        )
        .first()
    )

    if not workflow or not workflow.is_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow is disabled or unavailable",
        )

    # Execute again and preserve the original execution history
    try:
        retry = execute_workflow(
            db=db,
            workflow=workflow,
            input_data=original.input_data or {},
            retry_of_id=original.id,
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retry workflow execution",
        )

    return retry
