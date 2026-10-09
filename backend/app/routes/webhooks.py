
import hmac

from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.workflow import Workflow
from app.models.workflow_trigger import WorkflowTrigger
from app.schemas.execution import ExecutionCreate
from app.services.workflow_engine import execute_workflow


router = APIRouter(
    prefix="/webhooks",
    tags=["Webhooks"],
)


@router.post(
    "/{workflow_id}",
    status_code=status.HTTP_202_ACCEPTED,
)
def trigger_webhook(
    workflow_id: int,
    payload: ExecutionCreate,
    x_webhook_secret: str = Header(...),
    db: Session = Depends(get_db),
):
    # 1. Check whether the workflow exists and is enabled
    workflow = (
        db.query(Workflow)
        .filter(
            Workflow.id == workflow_id,
            Workflow.is_enabled.is_(True),
        )
        .first()
    )

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or disabled",
        )

    # 2. Check webhook trigger configuration
    trigger = (
        db.query(WorkflowTrigger)
        .filter(
            WorkflowTrigger.workflow_id == workflow_id,
            WorkflowTrigger.trigger_type == "webhook",
        )
        .first()
    )

    if not trigger:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook trigger is not configured",
        )

    # 3. Read the configured secret
    configured_secret = (trigger.config or {}).get("secret")

    # 4. Validate the incoming webhook secret
    if (
        not isinstance(configured_secret, str)
        or not configured_secret
        or not hmac.compare_digest(
            x_webhook_secret,
            configured_secret,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook secret",
        )

    # 5. Execute the workflow
    execution = execute_workflow(
        db=db,
        workflow=workflow,
        input_data=payload.input_data,
    )

    # 6. Return execution details
    return {
        "message": "Webhook received",
        "execution_id": execution.id,
        "status": execution.status,
    }
