from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from app.database import Base


class WorkflowCondition(Base):
    __tablename__ = "workflow_conditions"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    field = Column(String(100), nullable=False)
    operator = Column(String(30), nullable=False)
    value = Column(JSON, nullable=True)