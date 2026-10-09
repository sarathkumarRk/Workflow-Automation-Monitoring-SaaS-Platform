from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models

from app.routes.auth import router as auth_router
from app.routes.workflows import router as workflows_router
from app.routes.executions import router as executions_router
from app.routes.webhooks import router as webhooks_router

from app.services.scheduler_service import (
    start_scheduler,
    stop_scheduler,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    Base.metadata.create_all(bind=engine)

    # Start scheduled workflows
    start_scheduler()

    yield

    # Stop scheduler during shutdown
    stop_scheduler()


app = FastAPI(
    title="Workflow Automation & Monitoring SaaS",
    description="Workflow creation, execution, and monitoring API",
    version="1.0.0",
    lifespan=lifespan,
)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register Routers
app.include_router(auth_router)
app.include_router(workflows_router)
app.include_router(executions_router)
app.include_router(webhooks_router)


@app.get("/")
def home():
    return {
        "message": "Workflow Automation API is running",
    }





