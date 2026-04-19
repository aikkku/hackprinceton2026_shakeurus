"""
Proxy API for the ShakeUs web app. Forwards requests to the Pi (shakeus) URL.
Set SHAKEUS_BASE_URL to your ngrok URL or local IP.
"""

from __future__ import annotations

import os
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from starlette.responses import Response

load_dotenv()

SHAKEUS_BASE = os.environ.get(
    "SHAKEUS_BASE_URL",
    "https://slot-emoticon-drab.ngrok-free.dev",
).rstrip("/")

_DEFAULT_HEADERS = {"ngrok-skip-browser-warning": "true", "Accept": "application/json"}

_cors_raw = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:8070,http://127.0.0.1:8070",
).strip()
if _cors_raw == "*":
    _cors_origins: list[str] = ["*"]
else:
    _cors_origins = [o.strip() for o in _cors_raw.split(",") if o.strip()]

app = FastAPI(title="ShakeUs Web API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # <--- CHANGE THIS LINE TO ["*"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TriggerPayload(BaseModel):
    song_file: str | None = None


class ScheduleAlarmPayload(BaseModel):
    time: str
    song_file: str | None = None


class ScheduleTimerPayload(BaseModel):
    seconds: int = Field(ge=1, le=86400)
    song_file: str | None = None


async def _forward(method: str, path: str, json_body: Any | None = None) -> Response:
    url = f"{SHAKEUS_BASE}{path}"
    timeout = httpx.Timeout(60.0, connect=15.0)
    kw: dict[str, Any] = {"headers": _DEFAULT_HEADERS}
    if json_body is not None:
        kw["json"] = json_body
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            r = await client.request(method, url, **kw)
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Cannot reach shakeus at {SHAKEUS_BASE}: {e!s}",
            ) from e

    ct = r.headers.get("content-type", "application/json")
    return Response(content=r.content, status_code=r.status_code, media_type=ct)


@app.get("/health")
def health():
    return {"ok": True, "shakeus_base": SHAKEUS_BASE}


# Forward to shakeus using the same /api/* paths as the React app. On shakeus, /songs
# is also a StaticFiles mount — calling GET /songs can 404; /api/songs is always the JSON list.
@app.get("/api/songs")
async def api_songs():
    return await _forward("GET", "/api/songs")


@app.post("/api/trigger")
async def api_trigger(payload: TriggerPayload | None = Body(default=None)):
    body = None
    if payload is not None:
        body = payload.model_dump(exclude_none=True)
        if not body:
            body = None
    return await _forward("POST", "/api/trigger", json_body=body)


@app.post("/api/stop")
async def api_stop():
    return await _forward("POST", "/api/stop")


@app.get("/api/status")
async def api_status():
    return await _forward("GET", "/api/status")


@app.get("/api/schedule")
async def api_schedule_get():
    return await _forward("GET", "/api/schedule")


@app.post("/api/schedule/alarm")
async def api_schedule_alarm(payload: ScheduleAlarmPayload):
    return await _forward("POST", "/api/schedule/alarm", json_body=payload.model_dump(exclude_none=True))


@app.post("/api/schedule/timer")
async def api_schedule_timer(payload: ScheduleTimerPayload):
    return await _forward("POST", "/api/schedule/timer", json_body=payload.model_dump(exclude_none=True))


@app.post("/api/schedule/cancel")
async def api_schedule_cancel():
    return await _forward("POST", "/api/schedule/cancel")
