from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.workflow import Workflow
from app.schemas.workflow import WorkflowCreate, WorkflowResponse
from app.dependencies import get_current_user


router = APIRouter(prefix="/workflows", tags=["Workflows"])


# Create Workflow
@router.post(
    "/",
    response_model=WorkflowResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_workflow(
    workflow_data: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workflow = Workflow(
        user_id=current_user.id,
        name=workflow_data.name,
        description=workflow_data.description,
        is_enabled=workflow_data.is_enabled,
    )

    db.add(workflow)
    db.commit()
    db.refresh(workflow)

    return workflow


# List Workflows with Pagination and Sorting
@router.get("/", response_model=list[WorkflowResponse])
def get_workflows(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    allowed_sort_fields = {
        "id": Workflow.id,
        "name": Workflow.name,
        "created_at": Workflow.created_at,
    }

    if sort_by not in allowed_sort_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid sort field",
        )

    query = db.query(Workflow).filter(
        Workflow.user_id == current_user.id
    )

    if search:
        query = query.filter(
            Workflow.name.ilike(f"%{search}%")
        )

    sort_column = allowed_sort_fields[sort_by]

    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    return query.offset((page - 1) * limit).limit(limit).all()


# Get Single Workflow
@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id,
    ).first()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    return workflow


# Update Workflow
@router.put("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(
    workflow_id: int,
    workflow_data: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id,
    ).first()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    workflow.name = workflow_data.name
    workflow.description = workflow_data.description
    workflow.is_enabled = workflow_data.is_enabled

    db.commit()
    db.refresh(workflow)

    return workflow


# Delete Workflow
@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id,
    ).first()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    db.delete(workflow)
    db.commit()


# Enable / Disable Workflow
@router.patch("/{workflow_id}/status", response_model=WorkflowResponse)
def update_workflow_status(
    workflow_id: int,
    is_enabled: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id,
    ).first()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    workflow.is_enabled = is_enabled

    db.commit()
    db.refresh(workflow)

    return workflow