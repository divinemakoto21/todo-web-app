"""
TaskFlow Pro - Pydantic Data Schemas
Handles request payload validation and response serialization
"""

from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=120, description="Task title")
    description: Optional[str] = Field(None, max_length=500, description="Optional task details")
    priority: str = Field("medium", pattern="^(low|medium|high)$", description="Priority level")
    due_date: Optional[str] = Field(None, description="Due date in YYYY-MM-DD format")

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = Field(None, max_length=500)
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    due_date: Optional[str] = None
    is_completed: Optional[bool] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    priority: str
    due_date: Optional[str] = None
    is_completed: bool
    created_at: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)
