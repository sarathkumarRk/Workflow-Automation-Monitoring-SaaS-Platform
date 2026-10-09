from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from app.database import Base


class WorkflowTrigger(Base):
    __tablename__ = "workflow_triggers"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    trigger_type = Column(String(30), nullable=False)
    config = Column(JSON, nullable=True)