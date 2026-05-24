import json
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from database import get_db

router = APIRouter(prefix="/api/ai", tags=["ai"])

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None

class ParseIntentRequest(BaseModel):
    text: str

@router.post("/chat")
def chat(data: ChatRequest):
    msg = data.message.lower()

    # Save assistant reply to DB if session exists
    reply = ""
    actions = []

    if "创建任务" in msg or "新建任务" in msg or "添加任务" in msg:
        import re
        title_match = re.search(r'(?:创建|新建|添加)任务[：:]?\s*(.+)', data.message)
        if title_match:
            title = title_match.group(1)
            priority = "high" if any(k in msg for k in ["紧急", "重要", "优先"]) else "medium"
            reply = f"已为你创建任务「{title}」（{priority}优先级）。你可以在任务列表中查看和管理它。"
            actions.append({
                "type": "create_task",
                "payload": {"title": title, "priority": priority, "status": "pending"}
            })

    elif "创建时间块" in msg or "安排" in msg or "添加时间块" in msg:
        import re
        title_match = re.search(r'(?:创建时间块|安排|添加时间块)[：:]?\s*(.+)', data.message)
        if title_match:
            title = title_match.group(1)
            reply = f"已为你创建时间块「{title}」。你可以在日历视图中查看。"
            actions.append({
                "type": "create_time_block",
                "payload": {"title": title, "block_type": "work"}
            })

    elif "专注" in msg or "番茄" in msg or "开始计时" in msg:
        reply = "好的，已为你启动一个25分钟的番茄钟，专注当下吧。"
        actions.append({
            "type": "start_focus",
            "payload": {"duration_minutes": 25}
        })

    elif "今天" in msg and ("计划" in msg or "安排" in msg or "做什么" in msg):
        reply = "为你规划今天的时间安排：\n\n09:00-10:00 处理高优先级任务\n10:00-11:00 深度工作（番茄钟）\n11:00-12:00 会议/沟通\n14:00-15:00 学习提升\n15:00-17:00 项目开发\n17:00-18:00 收尾总结\n\n需要我帮你创建这些时间块吗？"

    elif "分析" in msg or "统计" in msg or "报告" in msg:
        reply = "你可以查看「分析」标签页，里面有专注时长趋势、任务分布、高效时段等数据。或者告诉我你想了解哪方面的统计？"

    elif "你好" in msg or "hi" in msg or "hello" in msg:
        reply = "你好，我是 TimeMate AI 助手。我可以帮你规划时间、创建任务、启动番茄钟、分析效率数据。有什么可以帮你的？"

    else:
        reply = f"收到你的消息。我可以帮你：\n- 创建任务（如：创建任务 完成周报）\n- 安排时间块（如：安排 明天09:00团队会议）\n- 启动番茄钟（如：开始专注）\n- 分析效率数据\n\n请告诉我你想做什么？"

    # Persist assistant reply
    if data.session_id:
        conn = get_db()
        conn.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'assistant', ?)",
            (data.session_id, reply)
        )
        conn.execute(
            "UPDATE chat_sessions SET updated_at = datetime('now', 'localtime') WHERE id = ?",
            (data.session_id,)
        )
        conn.commit()
        conn.close()

    return {"reply": reply, "actions": actions}

@router.post("/parse-intent")
def parse_intent(data: ParseIntentRequest):
    text = data.text
    intent = "unknown"
    entities = {}

    if any(k in text for k in ["创建任务", "新建任务", "添加任务"]):
        intent = "create_task"
        import re
        m = re.search(r'任务[：:]?\s*(.+)', text)
        if m:
            entities["title"] = m.group(1).strip()
    elif any(k in text for k in ["安排", "创建时间块", "时间块"]):
        intent = "create_time_block"
        import re
        m = re.search(r'(?:安排|创建)[：:]?\s*(.+)', text)
        if m:
            entities["title"] = m.group(1).strip()
    elif any(k in text for k in ["专注", "番茄", "计时", "开始"]):
        intent = "start_focus"
    elif any(k in text for k in ["分析", "统计", "报告"]):
        intent = "analytics"
    elif any(k in text for k in ["今天", "今日", "计划"]):
        intent = "daily_plan"

    return {"intent": intent, "entities": entities}