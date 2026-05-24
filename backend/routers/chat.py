from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db

router = APIRouter(prefix="/api/chat", tags=["chat"])

class SessionCreate(BaseModel):
    title: str

class MessageCreate(BaseModel):
    content: str

@router.get("/sessions")
def list_sessions():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM chat_sessions ORDER BY updated_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/sessions")
def create_session(data: SessionCreate):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO chat_sessions (title) VALUES (?)",
        (data.title,)
    )
    row = conn.execute("SELECT * FROM chat_sessions WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.commit()
    conn.close()
    return dict(row)

@router.delete("/sessions/{session_id}")
def delete_session(session_id: int):
    conn = get_db()
    conn.execute("DELETE FROM chat_sessions WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()
    return {"ok": True}

@router.get("/sessions/{session_id}/messages")
def get_messages(session_id: int):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at",
        (session_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/sessions/{session_id}/messages")
def add_message(session_id: int, data: MessageCreate):
    conn = get_db()
    session = conn.execute("SELECT * FROM chat_sessions WHERE id = ?", (session_id,)).fetchone()
    if not session:
        conn.close()
        raise HTTPException(404, "Session not found")

    conn.execute(
        "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'user', ?)",
        (session_id, data.content)
    )
    conn.execute(
        "UPDATE chat_sessions SET updated_at = datetime('now', 'localtime') WHERE id = ?",
        (session_id,)
    )
    row = conn.execute(
        "SELECT * FROM chat_messages WHERE id = last_insert_rowid()"
    ).fetchone()
    conn.commit()
    conn.close()
    return dict(row)