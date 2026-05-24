from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    status: str = "pending"
    due_date: Optional[str] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    time_block_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    time_block_id: Optional[int] = None

@router.get("")
def list_tasks(status: Optional[str] = None, priority: Optional[str] = None):
    conn = get_db()
    query = "SELECT * FROM tasks WHERE 1=1"
    params = []
    if status:
        query += " AND status = ?"
        params.append(status)
    if priority:
        query += " AND priority = ?"
        params.append(priority)
    query += " ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("")
def create_task(data: TaskCreate):
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO tasks (title, description, priority, status, due_date, estimated_minutes, actual_minutes, time_block_id)
           VALUES (?,?,?,?,?,?,?,?)""",
        (data.title, data.description, data.priority, data.status, data.due_date,
         data.estimated_minutes, data.actual_minutes, data.time_block_id)
    )
    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.commit()
    conn.close()
    return dict(row)

@router.put("/{task_id}")
def update_task(task_id: int, data: TaskUpdate):
    conn = get_db()
    existing = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(404, "Task not found")

    fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if fields:
        fields["updated_at"] = "datetime('now', 'localtime')"
        sets = ", ".join(f"{k} = ?" for k in fields)
        conn.execute(f"UPDATE tasks SET {sets} WHERE id = ?", (*fields.values(), task_id))

    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    conn.commit()
    conn.close()
    return dict(row)

@router.delete("/{task_id}")
def delete_task(task_id: int):
    conn = get_db()
    conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return {"ok": True}