"""
TaskFlow Pro - FastAPI Application Server
REST API for Todo Management connected to SQLite database
"""

import sqlite3
from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from . import schemas, crud
from .database import init_db, get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan:
    Initializes SQLite table schema and seeds initial tasks on startup.
    """
    init_db()
    yield

# Initialize FastAPI app
app = FastAPI(
    title="TaskFlow Pro API",
    description="Python FastAPI REST API with SQLite database for University Task Management Web App",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend integration (browser preview on port 3000, 5500, or file:// origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint confirming that FastAPI and SQLite are operational."""
    return {
        "status": "ok",
        "backend": "Python FastAPI",
        "database": "SQLite",
        "version": "1.0.0"
    }

@app.get("/api/tasks", response_model=List[schemas.TaskResponse], tags=["Tasks"])
def read_tasks(skip: int = 0, limit: int = 200, db: sqlite3.Connection = Depends(get_db)):
    """Retrieve all tasks from SQLite."""
    return crud.get_tasks(db, skip=skip, limit=limit)

@app.post("/api/tasks", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED, tags=["Tasks"])
def create_new_task(task: schemas.TaskCreate, db: sqlite3.Connection = Depends(get_db)):
    """Create a new task in SQLite."""
    return crud.create_task(db, task_data=task)

@app.get("/api/tasks/{task_id}", response_model=schemas.TaskResponse, tags=["Tasks"])
def read_single_task(task_id: int, db: sqlite3.Connection = Depends(get_db)):
    """Retrieve a single task by ID from SQLite."""
    task = crud.get_task(db, task_id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task

@app.put("/api/tasks/{task_id}", response_model=schemas.TaskResponse, tags=["Tasks"])
def update_task_fields(task_id: int, updates: schemas.TaskUpdate, db: sqlite3.Connection = Depends(get_db)):
    """Update fields or toggle completion status for a task in SQLite."""
    updated = crud.update_task(db, task_id=task_id, updates=updates)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return updated

@app.delete("/api/tasks/{task_id}", tags=["Tasks"])
def delete_task(task_id: int, db: sqlite3.Connection = Depends(get_db)):
    """Delete a task by ID from SQLite."""
    success = crud.delete_task(db, task_id=task_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return {"success": True, "id": task_id, "message": "Task successfully deleted from SQLite"}
