from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db

router = APIRouter(prefix="/api/time-blocks", tags=["time-blocks"])

class TimeBlockCreate(BaseModel):
    title: str
    start_time: str
    end_time: str
    block_type: str = "work"
    color: str = "work"
    notes: Optional[str] = None

class TimeBlockUpdate(BaseModel):
    title: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    block_type: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None

@router.get("")
def list_blocks(date: Optional[str] = None):
    conn = get_db()
    if date:
        rows = conn.execute(
            "SELECT * FROM time_blocks WHERE date(start_time) = date(?) ORDER BY start_time",
            (date,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM time_blocks ORDER BY start_time DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("")
def create_block(data: TimeBlockCreate):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO time_blocks (title, start_time, end_time, block_type, color, notes) VALUES (?,?,?,?,?,?)",
        (data.title, data.start_time, data.end_time, data.block_type, data.color, data.notes)
    )
    row = conn.execute("SELECT * FROM time_blocks WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.commit()
    conn.close()
    return dict(row)

@router.put("/{block_id}")
def update_block(block_id: int, data: TimeBlockUpdate):
    conn = get_db()
    existing = conn.execute("SELECT * FROM time_blocks WHERE id = ?", (block_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(404, "Time block not found")

    fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if fields:
        sets = ", ".join(f"{k} = ?" for k in fields)
        conn.execute(f"UPDATE time_blocks SET {sets} WHERE id = ?", (*fields.values(), block_id))

    row = conn.execute("SELECT * FROM time_blocks WHERE id = ?", (block_id,)).fetchone()
    conn.commit()
    conn.close()
    return dict(row)

@router.delete("/{block_id}")
def delete_block(block_id: int):
    conn = get_db()
    conn.execute("DELETE FROM time_blocks WHERE id = ?", (block_id,))
    conn.commit()
    conn.close()
    return {"ok": True}