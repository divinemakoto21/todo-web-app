"""
TaskFlow Pro - SQLite Database Operations
Implements standard CRUD operations directly against SQLite
"""

import sqlite3
from typing import List, Optional, Dict, Any
from . import schemas

def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    """Helper to convert sqlite3.Row to standard dict with boolean is_completed."""
    d = dict(row)
    d["is_completed"] = bool(d.get("is_completed", 0))
    return d

def get_tasks(conn: sqlite3.Connection, skip: int = 0, limit: int = 200) -> List[Dict[str, Any]]:
    """Retrieve all tasks ordered by newest first (descending ID)."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, title, description, priority, due_date, is_completed, created_at
        FROM tasks
        ORDER BY id DESC
        LIMIT ? OFFSET ?;
    """, (limit, skip))
    rows = cursor.fetchall()
    return [row_to_dict(r) for r in rows]

def get_task(conn: sqlite3.Connection, task_id: int) -> Optional[Dict[str, Any]]:
    """Fetch a single task by ID."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, title, description, priority, due_date, is_completed, created_at
        FROM tasks
        WHERE id = ?;
    """, (task_id,))
    row = cursor.fetchone()
    if not row:
        return None
    return row_to_dict(row)

def create_task(conn: sqlite3.Connection, task_data: schemas.TaskCreate) -> Dict[str, Any]:
    """Insert a new task into the SQLite tasks table."""
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO tasks (title, description, priority, due_date, is_completed)
        VALUES (?, ?, ?, ?, 0);
    """, (
        task_data.title.strip(),
        task_data.description.strip() if task_data.description else None,
        task_data.priority,
        task_data.due_date
    ))
    conn.commit()
    new_id = cursor.lastrowid
    return get_task(conn, new_id)

def update_task(conn: sqlite3.Connection, task_id: int, updates: schemas.TaskUpdate) -> Optional[Dict[str, Any]]:
    """Dynamically update specified fields of an existing task."""
    existing = get_task(conn, task_id)
    if not existing:
        return None

    update_fields = []
    values = []

    update_dict = updates.model_dump(exclude_unset=True)
    if not update_dict:
        return existing

    for key, value in update_dict.items():
        if key == "title" and value is not None:
            update_fields.append("title = ?")
            values.append(value.strip())
        elif key == "description" and value is not None:
            update_fields.append("description = ?")
            values.append(value.strip())
        elif key == "priority" and value is not None:
            update_fields.append("priority = ?")
            values.append(value)
        elif key == "due_date":
            update_fields.append("due_date = ?")
            values.append(value)
        elif key == "is_completed" and value is not None:
            update_fields.append("is_completed = ?")
            values.append(1 if value else 0)

    if not update_fields:
        return existing

    values.append(task_id)
    sql = f"UPDATE tasks SET {', '.join(update_fields)} WHERE id = ?;"

    cursor = conn.cursor()
    cursor.execute(sql, values)
    conn.commit()

    return get_task(conn, task_id)

def delete_task(conn: sqlite3.Connection, task_id: int) -> bool:
    """Delete a task from SQLite."""
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?;", (task_id,))
    conn.commit()
    return cursor.rowcount > 0
