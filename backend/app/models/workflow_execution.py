from sqlalchemy import (
    Column,
    Integer,
    String,
    JSON,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.sql import func

from app.database import Base


class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id = Column(Integer, primary_key=True, index=True)

    workflow_id = Column(
        Integer,
        ForeignKey("workflows.id"),
        nullable=False,
    )

    status = Column(
        String(20),
        default="PENDING",
        nullable=False,
    )

    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    error_message = Column(String(500), nullable=True)

    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Retry tracking
    retry_of_id = Column(
        Integer,
        ForeignKey("workflow_executions.id"),
        nullable=True,
    )

    # Scheduled execution tracking
    scheduled_for = Column(DateTime, nullable=True)

    __table_args__ = (
        Index(
            "uq_workflow_scheduled_occurrence",
            "workflow_id",
            "scheduled_for",
            unique=True,
        ),
    )