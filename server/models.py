import json
from datetime import datetime, timedelta
import secrets
from database import get_db


def get_or_create_user(openid: str) -> dict:
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE openid = ?", (openid,)).fetchone()
    if row:
        db.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE openid = ?", (openid,))
        db.commit()
        db.close()
        return dict(row)
    db.execute("INSERT INTO users (openid) VALUES (?)", (openid,))
    db.commit()
    row = db.execute("SELECT * FROM users WHERE openid = ?", (openid,)).fetchone()
    db.close()
    return dict(row)


def update_user_profile(openid: str, nickname: str, avatar_url: str):
    db = get_db()
    db.execute(
        "UPDATE users SET nickname = ?, avatar_url = ? WHERE openid = ?",
        (nickname, avatar_url, openid),
    )
    db.commit()
    db.close()


def create_session(openid: str) -> str:
    token = secrets.token_hex(32)
    expires = (datetime.utcnow() + timedelta(days=7)).isoformat()
    db = get_db()
    db.execute(
        "INSERT OR REPLACE INTO sessions (token, openid, expires_at) VALUES (?, ?, ?)",
        (token, openid, expires),
    )
    db.commit()
    db.close()
    return token


def get_session(token: str) -> dict | None:
    db = get_db()
    row = db.execute("SELECT * FROM sessions WHERE token = ?", (token,)).fetchone()
    db.close()
    if not row:
        return None
    session = dict(row)
    if session["expires_at"] < datetime.utcnow().isoformat():
        delete_session(token)
        return None
    return session


def delete_session(token: str):
    db = get_db()
    db.execute("DELETE FROM sessions WHERE token = ?", (token,))
    db.commit()
    db.close()


def get_all_official_banks() -> list[dict]:
    db = get_db()
    rows = db.execute(
        "SELECT id, title, category, question_count, created_at FROM official_banks ORDER BY id"
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]


def get_official_bank_by_id(bank_id: int) -> dict | None:
    db = get_db()
    row = db.execute("SELECT * FROM official_banks WHERE id = ?", (bank_id,)).fetchone()
    db.close()
    if not row:
        return None
    bank = dict(row)
    bank["questions"] = json.loads(bank["questions"])
    return bank


def add_user_favorite(user_id: int, bank_id: int) -> bool:
    db = get_db()
    try:
        db.execute(
            "INSERT INTO user_favorites (user_id, bank_id) VALUES (?, ?)",
            (user_id, bank_id),
        )
        db.commit()
        db.close()
        return True
    except Exception:
        db.close()
        return False


def is_already_favorited(user_id: int, bank_id: int) -> bool:
    db = get_db()
    row = db.execute(
        "SELECT id FROM user_favorites WHERE user_id = ? AND bank_id = ?",
        (user_id, bank_id),
    ).fetchone()
    db.close()
    return row is not None
