from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import time_blocks, tasks, focus_sessions, analytics, chat, ai

app = FastAPI(title="TimeMate API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(time_blocks.router)
app.include_router(tasks.router)
app.include_router(focus_sessions.router)
app.include_router(analytics.router)
app.include_router(chat.router)
app.include_router(ai.router)

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def root():
    return {"name": "TimeMate API", "version": "1.0.0", "docs": "/docs"}