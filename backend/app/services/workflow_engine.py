
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.workflow import Workflow
from app.models.workflow_condition import WorkflowCondition
from app.models.workflow_action import WorkflowAction
from app.models.workflow_execution import WorkflowExecution
from app.models.execution_step_log import ExecutionStepLog

from app.services.condition_engine import evaluate_condition
from app.services.action_service import execute_action


def utc_now() -> datetime:
    """Return current UTC time as a naive datetime for MySQL compatibility."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def execute_workflow(
    db: Session,
    workflow: Workflow,
    input_data: dict,
    retry_of_id: int | None = None,
    scheduled_for: datetime | None = None,
) -> WorkflowExecution:
    """
    Execute an enabled workflow, evaluate conditions, run actions,
    record step logs, and preserve execution history.
    """

    if not workflow.is_enabled:
        raise ValueError("Workflow is disabled")

    execution = WorkflowExecution(
        workflow_id=workflow.id,
        status="PENDING",
        input_data=input_data or {},
        retry_of_id=retry_of_id,
        scheduled_for=scheduled_for,
    )

    db.add(execution)
    db.commit()
    db.refresh(execution)

    execution.status = "RUNNING"
    execution.started_at = utc_now()
    db.commit()

    results = []

    try:
        # 1. Evaluate all workflow conditions
        conditions = (
            db.query(WorkflowCondition)
            .filter(
                WorkflowCondition.workflow_id == workflow.id
            )
            .order_by(WorkflowCondition.id.asc())
            .all()
        )

        conditions_matched = True

        for condition in conditions:
            matched = evaluate_condition(
                input_data=input_data or {},
                field=condition.field,
                operator=condition.operator,
                expected_value=condition.value,
            )

            if not matched:
                conditions_matched = False
                break

        # 2. Skip actions if any condition fails
        if not conditions_matched:
            execution.output_data = {
                "message": "Conditions not satisfied",
                "actions_skipped": True,
                "actions": [],
            }
            execution.status = "SUCCESS"

        else:
            # 3. Execute actions sequentially
            actions = (
                db.query(WorkflowAction)
                .filter(
                    WorkflowAction.workflow_id == workflow.id
                )
                .order_by(WorkflowAction.id.asc())
                .all()
            )

            for action in actions:
                action_input = {
                    **(action.config or {}),
                    "type": action.action_type,
                }

                try:
                    result = execute_action(
                        action_config=action_input,
                        input_data=input_data or {},
                    )

                    if not isinstance(result, dict):
                        result = {
                            "success": False,
                            "error": "Action returned an invalid result",
                        }

                except Exception as action_error:
                    result = {
                        "success": False,
                        "error": str(action_error),
                    }

                success = result.get("success") is True

                # 4. Save action-by-action execution log
                log = ExecutionStepLog(
                    execution_id=execution.id,
                    action_type=action.action_type,
                    status="SUCCESS" if success else "FAILED",
                    input_data=input_data or {},
                    output_data=result,
                    error_message=(
                        None
                        if success
                        else str(result.get("error", "Action failed"))
                    ),
                )

                db.add(log)
                db.commit()

                results.append({
                    "action_type": action.action_type,
                    **result,
                })

                # Stop subsequent actions if one fails
                if not success:
                    execution.status = "FAILED"
                    execution.error_message = str(
                        result.get("error", "Workflow action failed")
                    )
                    execution.output_data = {"actions": results}
                    break

            else:
                # All actions completed successfully
                execution.status = "SUCCESS"
                execution.output_data = {"actions": results}

    except Exception as exc:
        db.rollback()

        # Reload the execution after rollback
        execution = (
            db.query(WorkflowExecution)
            .filter(WorkflowExecution.id == execution.id)
            .first()
        )

        if execution is None:
            raise

        execution.status = "FAILED"
        execution.error_message = str(exc)
        execution.output_data = {"actions": results}

    finally:
        execution.ended_at = utc_now()
        db.commit()
        db.refresh(execution)

    return execution
