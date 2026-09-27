"""
TaskFlow Pro - SQLite Database Engine
Built using Python's standard library sqlite3 for maximum portability,
stability, and zero-dependency database access.
"""

import os
import sqlite3
from typing import Generator

# SQLite database file path in backend directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BACKEND_DIR, "tasks.db")

def get_db_connection() -> sqlite3.Connection:
    """
    Establish a thread-safe connection to the SQLite database.
    Sets row_factory to sqlite3.Row to support dictionary-like column access.
    """
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """
    Initialize SQLite database schema and seed initial demo data if empty.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create tasks table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(120) NOT NULL,
            description TEXT,
            priority VARCHAR(10) DEFAULT 'medium',
            due_date VARCHAR(20),
            is_completed BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()

    # Check if table is empty, if so, seed sample university tasks
    cursor.execute("SELECT COUNT(*) AS count FROM tasks;")
    row = cursor.fetchone()
    if row and row["count"] == 0:
        seed_tasks = [
            (
                "Finalize Software Engineering Proposal",
                "Prepare project scope document, entity-relationship diagram, and system architecture overview for university evaluation.",
                "high",
                "2026-09-28",
                0
            ),
            (
                "Design Database Schema in SQLite",
                "Write SQL DDL tables for tasks with primary keys, priority constraints, timestamps, and indexes.",
                "medium",
                "2026-10-01",
                0
            ),
            (
                "Implement FastAPI REST Endpoints",
                "Develop Python routers for /api/tasks with Pydantic schemas, validation, and CORS middleware enabled.",
                "high",
                "2026-10-03",
                0
            ),
            (
                "Review UI/UX Accessibility Guidelines",
                "Audit responsive viewport behavior, contrast ratios, and keyboard navigation across laptop and mobile displays.",
                "low",
                "2026-09-24",
                1
            ),
            (
                "Configure Python Virtual Environment",
                "Setup backend/venv with FastAPI, Uvicorn, and automated test runners.",
                "low",
                "2026-09-23",
                1
            )
        ]
        cursor.executemany("""
            INSERT INTO tasks (title, description, priority, due_date, is_completed)
            VALUES (?, ?, ?, ?, ?);
        """, seed_tasks)
        conn.commit()

    conn.close()

def get_db() -> Generator[sqlite3.Connection, None, None]:
    """
    FastAPI dependency yielding a managed SQLite connection per request.
    """
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()
