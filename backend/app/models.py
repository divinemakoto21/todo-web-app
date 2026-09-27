"""
TaskFlow Pro - SQLAlchemy Database Models
Defines the SQLite table schema for Tasks
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from .database import Base

class Task(Base):
    """
    Task Entity Model representing the 'tasks' table in SQLite.
    """
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(10), default="medium", nullable=False)
    due_date = Column(String(20), nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<Task(id={self.id}, title='{self.title}', priority='{self.priority}', completed={self.is_completed})>"
