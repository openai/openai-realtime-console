import os
import re
import sqlite3
import uuid
from datetime import datetime, timezone

import httpx

DB_PATH = "/Users/minjaekwon1/Projects/Active/voice-system-unified/database/transcriptions.db"


def test_server_starts(server):
    r = httpx.get(f"{server}/config", timeout=5)
    assert r.status_code == 200


def test_korean_prompt_loaded(server):
    r = httpx.get(f"{server}/reflection-context").json()
    instructions = r["instructions"]
    assert "한국어" in instructions
    assert "당신은" in instructions


def test_no_english_fallback_phrases(server):
    r = httpx.get(f"{server}/reflection-context").json()
    instructions = r["instructions"]
    forbidden = ["You must respond in English", "Always respond in English", "You are a helpful voice assistant for daily reflection"]
    for phrase in forbidden:
        assert phrase not in instructions, f"Found forbidden English phrase: {phrase}"


def test_gps_not_raw_in_prompt(server):
    r = httpx.get(f"{server}/reflection-context").json()
    instructions = r["instructions"]
    raw_gps = re.findall(r"\b\d{2}\.\d{4},\s*-?\d{2,3}\.\d{4}\b", instructions)
    assert len(raw_gps) == 0, f"Raw GPS coordinates found in prompt: {raw_gps[:3]}"


def test_save_annotation_works(server):
    r = httpx.post(f"{server}/api/annotations", json={
        "type": "remember",
        "content": "automated test annotation — delete me",
    })
    assert r.status_code == 200
    assert r.json()["ok"] is True

    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM annotations WHERE content = 'automated test annotation — delete me'")
    conn.commit()
    conn.close()


def test_save_annotation_rejects_invalid_type(server):
    r = httpx.post(f"{server}/api/annotations", json={
        "type": "INVALID_TYPE",
        "content": "should fail",
    })
    assert r.status_code == 400


def test_search_memory(server):
    r = httpx.get(f"{server}/api/search-memory", params={"q": "test"}, timeout=20)
    assert r.status_code == 200


def test_session_save_and_idempotent(server):
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    transcript = [
        {"role": "assistant", "text": "테스트 응답입니다.", "ts": now},
    ]
    r = httpx.post(f"{server}/api/sessions/save", json={
        "session_id": session_id,
        "started_at": now,
        "ended_at": now,
        "transcript": transcript,
    })
    assert r.status_code == 200
    assert r.json()["ok"] is True
    assert r.json()["session_id"] == session_id

    r2 = httpx.post(f"{server}/api/sessions/save", json={
        "session_id": session_id,
        "started_at": now,
        "ended_at": now,
        "transcript": transcript,
    })
    assert r2.status_code == 200

    txt_path = r.json().get("txt_path", "")
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM reflection_sessions WHERE session_id = ?", (session_id,))
    conn.commit()
    conn.close()
    if txt_path and os.path.exists(txt_path):
        os.remove(txt_path)
