from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.models.workflow import Workflow
from app.models.workflow_trigger import WorkflowTrigger
from app.models.workflow_execution import WorkflowExecution
from app.services.workflow_engine import execute_workflow


scheduler = BackgroundScheduler(timezone="UTC")


def run_scheduled_workflows():
    db = SessionLocal()

    try:
        triggers = (
            db.query(WorkflowTrigger)
            .join(
                Workflow,
                Workflow.id == WorkflowTrigger.workflow_id,
            )
            .filter(
                WorkflowTrigger.trigger_type == "scheduled",
                Workflow.is_enabled.is_(True),
            )
            .all()
        )

        now = datetime.now(timezone.utc).replace(tzinfo=None)

        for trigger in triggers:
            config = trigger.config or {}
            interval = config.get("interval_minutes", 0)

            if not isinstance(interval, int) or interval < 1:
                continue

            interval_seconds = interval * 60
            timestamp = int(now.timestamp())
            slot_timestamp = (
                timestamp // interval_seconds
            ) * interval_seconds

            scheduled_for = datetime.fromtimestamp(
                slot_timestamp,
                tz=timezone.utc,
            ).replace(tzinfo=None)

            workflow = db.query(Workflow).filter(
                Workflow.id == trigger.workflow_id,
                Workflow.is_enabled.is_(True),
            ).first()

            if not workflow:
                continue

            existing = db.query(WorkflowExecution).filter(
                WorkflowExecution.workflow_id == workflow.id,
                WorkflowExecution.scheduled_for == scheduled_for,
            ).first()

            if existing:
                continue

            try:
                execute_workflow(
                    db=db,
                    workflow=workflow,
                    input_data=config.get("input_data", {}),
                    scheduled_for=scheduled_for,
                )
            except IntegrityError:
                # A concurrent scheduler may have created this slot.
                db.rollback()

    finally:
        db.close()


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            run_scheduled_workflows,
            trigger="interval",
            seconds=30,
            id="workflow_scheduler",
            replace_existing=True,
            max_instances=1,
        )
        scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)