from fastapi import APIRouter
from database import get_db

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/overview")
def overview():
    conn = get_db()
    total_focus = conn.execute(
        "SELECT COALESCE(SUM(actual_minutes), 0) FROM focus_sessions WHERE ended_at IS NOT NULL"
    ).fetchone()[0]
    total_sessions = conn.execute(
        "SELECT COUNT(*) FROM focus_sessions WHERE ended_at IS NOT NULL"
    ).fetchone()[0]
    completed_sessions = conn.execute(
        "SELECT COUNT(*) FROM focus_sessions WHERE ended_at IS NOT NULL AND interrupted = 0"
    ).fetchone()[0]
    task_done = conn.execute(
        "SELECT COUNT(*) FROM tasks WHERE status = 'done'"
    ).fetchone()[0]
    task_total = conn.execute(
        "SELECT COUNT(*) FROM tasks"
    ).fetchone()[0]
    interrupted = conn.execute(
        "SELECT COUNT(*) FROM focus_sessions WHERE ended_at IS NOT NULL AND interrupted = 1"
    ).fetchone()[0]
    avg_len = conn.execute(
        "SELECT COALESCE(ROUND(AVG(actual_minutes), 1), 0) FROM focus_sessions WHERE ended_at IS NOT NULL"
    ).fetchone()[0]
    conn.close()

    return {
        "total_focus_minutes": total_focus,
        "total_sessions": total_sessions,
        "completion_rate": (completed_sessions / total_sessions) if total_sessions else 0,
        "task_completion_rate": (task_done / task_total) if task_total else 0,
        "interruption_rate": (interrupted / total_sessions) if total_sessions else 0,
        "avg_session_minutes": avg_len,
    }

@router.get("/daily-focus")
def daily_focus(days: int = 7):
    conn = get_db()
    rows = conn.execute("""
        SELECT date(started_at) as date,
               COALESCE(SUM(actual_minutes), 0) as focus_minutes,
               COUNT(*) as sessions_count
        FROM focus_sessions
        WHERE started_at >= date('now', 'localtime', ?)
        GROUP BY date(started_at)
        ORDER BY date
    """, (f"-{days} days",)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/task-distribution")
def task_distribution():
    conn = get_db()
    rows = conn.execute(
        "SELECT status, COUNT(*) as count FROM tasks GROUP BY status"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/peak-productivity")
def peak_productivity():
    conn = get_db()
    rows = conn.execute("""
        SELECT CAST(strftime('%H', started_at) AS INTEGER) as hour,
               COALESCE(SUM(actual_minutes), 0) as total_minutes,
               COUNT(*) as session_count
        FROM focus_sessions
        WHERE ended_at IS NOT NULL
        GROUP BY hour
        ORDER BY hour
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/block-types")
def block_types():
    conn = get_db()
    rows = conn.execute("""
        SELECT block_type,
               COALESCE(ROUND(SUM((julianday(end_time) - julianday(start_time)) * 24), 1), 0) as total_hours,
               COUNT(*) as block_count
        FROM time_blocks
        GROUP BY block_type
        ORDER BY total_hours DESC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]