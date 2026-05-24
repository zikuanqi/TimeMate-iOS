from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db

router = APIRouter(prefix="/api/focus-sessions", tags=["focus-sessions"])

class FocusStart(BaseModel):
    task_id: Optional[int] = None
    duration_minutes: int

class FocusEnd(BaseModel):
    interrupted: bool = False
    interruption_count: int = 0
    notes: Optional[str] = None

@router.get("")
def list_sessions(date: Optional[str] = None, task_id: Optional[int] = None):
    conn = get_db()
    query = "SELECT * FROM focus_sessions WHERE 1=1"
    params = []
    if date:
        query += " AND date(started_at) = date(?)"
        params.append(date)
    if task_id:
        query += " AND task_id = ?"
        params.append(task_id)
    query += " ORDER BY started_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("")
def start_session(data: FocusStart):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO focus_sessions (task_id, duration_minutes) VALUES (?,?)",
        (data.task_id, data.duration_minutes)
    )
    row = conn.execute("SELECT * FROM focus_sessions WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.commit()
    conn.close()
    return dict(row)

@router.put("/{session_id}/end")
def end_session(session_id: int, data: FocusEnd):
    conn = get_db()
    existing = conn.execute("SELECT * FROM focus_sessions WHERE id = ?", (session_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(404, "Session not found")

    started = existing["started_at"]
    conn.execute("""
        UPDATE focus_sessions
        SET ended_at = datetime('now', 'localtime'),
            interrupted = ?,
            interruption_count = ?,
            notes = ?,
            actual_minutes = CAST((julianday('now', 'localtime') - julianday(?)) * 24 * 60 AS INTEGER)
        WHERE id = ?
    """, (1 if data.interrupted else 0, data.interruption_count, data.notes, started, session_id))

    conn.execute("""
        UPDATE tasks SET actual_minutes = COALESCE(actual_minutes, 0) + (
            SELECT CAST((julianday(ended_at) - julianday(started_at)) * 24 * 60 AS INTEGER)
            FROM focus_sessions WHERE id = ?
        )
        WHERE id = ?
    """, (session_id, existing["task_id"])) if existing["task_id"] else None

    row = conn.execute("SELECT * FROM focus_sessions WHERE id = ?", (session_id,)).fetchone()
    conn.commit()
    conn.close()
    return dict(row)

@router.get("/stats")
def daily_stats(date: str):
    conn = get_db()
    row = conn.execute("""
        SELECT
            COALESCE(SUM(actual_minutes), 0) as total_minutes,
            COUNT(*) as sessions_count,
            COALESCE(SUM(interruption_count), 0) as interruptions
        FROM focus_sessions
        WHERE date(started_at) = date(?)
    """, (date,)).fetchone()
    conn.close()
    return dict(row)