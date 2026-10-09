from sqlalchemy import Column, Integer, String, JSON, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class ExecutionStepLog(Base):
    __tablename__ = "execution_step_logs"

    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("workflow_executions.id"), nullable=False)
    action_type = Column(String(30), nullable=False)
    status = Column(String(20), nullable=False)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())