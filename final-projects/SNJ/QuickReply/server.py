"""Local API and static server for QuickReply. Run: python3 server.py"""

from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
import hashlib
import hmac
import json
import re
import secrets
import uuid


ROOT = Path(__file__).resolve().parent
WEB = ROOT / "web"
DATA = ROOT / "data"
USERS_FILE = DATA / "users.json"
SESSIONS_FILE = DATA / "sessions.json"
ACCOUNTS = DATA / "accounts"
HOST = "127.0.0.1"
PORT = 8766
PBKDF2_ROUNDS = 310_000
SESSION_DAYS = 30
FILE_LOCK = Lock()


def read_json(path, fallback):
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return fallback


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temp.replace(path)


def password_hash(password, salt):
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("ascii"), PBKDF2_ROUNDS).hex()


class Handler(BaseHTTPRequestHandler):
    def allowed_origin(self):
        origin = self.headers.get("Origin", "")
        return origin in {f"http://{HOST}:{PORT}", f"http://localhost:{PORT}"} or origin.startswith("chrome-extension://")

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        if self.allowed_origin():
            self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin"))
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(body)

    def request_payload(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length > 1_000_000:
            raise ValueError("Request too large")
        payload = json.loads(self.rfile.read(length) or b"{}")
        if not isinstance(payload, dict):
            raise ValueError("Expected a JSON object")
        return payload

    def auth_user(self):
        authorization = self.headers.get("Authorization", "")
        if not authorization.startswith("Bearer "):
            return None
        token_hash = hashlib.sha256(authorization[7:].encode("utf-8")).hexdigest()
        with FILE_LOCK:
            sessions = read_json(SESSIONS_FILE, {})
            session = sessions.get(token_hash)
            if not session or session.get("expires", 0) < datetime.now(timezone.utc).timestamp():
                return None
            users = read_json(USERS_FILE, [])
            return next((user for user in users if user["id"] == session.get("userId")), None)

    def create_session(self, user):
        token = secrets.token_urlsafe(36)
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        expiry = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
        with FILE_LOCK:
            sessions = read_json(SESSIONS_FILE, {})
            now = datetime.now(timezone.utc).timestamp()
            sessions = {key: item for key, item in sessions.items() if item.get("expires", 0) > now}
            sessions[token_hash] = {"userId": user["id"], "expires": expiry.timestamp()}
            write_json(SESSIONS_FILE, sessions)
        return token

    def do_OPTIONS(self):
        if not self.allowed_origin():
            return self.send_error(403)
        self.send_json({"ok": True})

    def do_GET(self):
        route = self.path.split("?", 1)[0]
        if route == "/api/health":
            return self.send_json({"ok": True})
        if route == "/api/auth/me":
            user = self.auth_user()
            return self.send_json({"user": {"email": user["email"]}} if user else {"error": "Sign in required"}, 200 if user else 401)
        if route == "/api/rules":
            user = self.auth_user()
            if not user:
                return self.send_json({"error": "Sign in required"}, 401)
            path = ACCOUNTS / user["id"] / "rules.json"
            return self.send_json({"rules": read_json(path, [])})

        relative = route.lstrip("/") or "index.html"
        path = (WEB / relative).resolve()
        if not path.is_relative_to(WEB.resolve()) or not path.is_file():
            return self.send_error(404)
        content_type = "text/html; charset=utf-8" if path.suffix == ".html" else "text/css; charset=utf-8" if path.suffix == ".css" else "text/javascript; charset=utf-8"
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        route = self.path.split("?", 1)[0]
        if self.headers.get("Origin") and not self.allowed_origin():
            return self.send_json({"error": "Origin not allowed"}, 403)
        try:
            payload = self.request_payload()
        except (ValueError, json.JSONDecodeError) as error:
            return self.send_json({"error": str(error)}, 400)

        if route in {"/api/auth/register", "/api/auth/login"}:
            email = str(payload.get("email", "")).strip().lower()
            password = str(payload.get("password", ""))
            if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
                return self.send_json({"error": "Enter a valid email address"}, 400)
            if route.endswith("register") and len(password) < 10:
                return self.send_json({"error": "Use a password with at least 10 characters"}, 400)
            if len(password) > 1024:
                return self.send_json({"error": "Password is too long"}, 400)
            first_account = False
            with FILE_LOCK:
                users = read_json(USERS_FILE, [])
                user = next((item for item in users if item["email"] == email), None)
                if route.endswith("register"):
                    if user:
                        return self.send_json({"error": "An account with that email already exists"}, 409)
                    first_account = not users
                    salt = secrets.token_hex(16)
                    user = {"id": uuid.uuid4().hex, "email": email, "salt": salt, "passwordHash": password_hash(password, salt)}
                    users.append(user)
                    write_json(USERS_FILE, users)
                elif not user or not hmac.compare_digest(user["passwordHash"], password_hash(password, user["salt"])):
                    return self.send_json({"error": "Email or password is incorrect"}, 401)
            if first_account:
                legacy_rules = read_json(DATA / "rules.json", None)
                if isinstance(legacy_rules, list):
                    write_json(ACCOUNTS / user["id"] / "rules.json", legacy_rules)
            token = self.create_session(user)
            return self.send_json({"token": token, "user": {"email": user["email"]}})

        if route == "/api/auth/logout":
            authorization = self.headers.get("Authorization", "")
            token_hash = hashlib.sha256(authorization[7:].encode("utf-8")).hexdigest() if authorization.startswith("Bearer ") else ""
            with FILE_LOCK:
                sessions = read_json(SESSIONS_FILE, {})
                sessions.pop(token_hash, None)
                write_json(SESSIONS_FILE, sessions)
            return self.send_json({"ok": True})

        if route == "/api/rules":
            user = self.auth_user()
            if not user:
                return self.send_json({"error": "Sign in required"}, 401)
            rules = payload.get("rules")
            if not isinstance(rules, list) or len(rules) > 500:
                return self.send_json({"error": "Expected up to 500 rules"}, 400)
            cleaned = []
            for rule in rules:
                if not isinstance(rule, dict):
                    continue
                question = str(rule.get("question", "")).strip()[:500]
                response = str(rule.get("response", "")).strip()[:5000]
                if not question or not response:
                    continue
                cleaned.append({
                    "id": str(rule.get("id") or uuid.uuid4()),
                    "question": question,
                    "response": response,
                    "enabled": bool(rule.get("enabled", True)),
                    "createdAt": str(rule.get("createdAt") or ""),
                })
            path = ACCOUNTS / user["id"] / "rules.json"
            with FILE_LOCK:
                write_json(path, cleaned)
            return self.send_json({"rules": cleaned})

        return self.send_json({"error": "Not found"}, 404)

    def log_message(self, _format, *_args):
        pass


if __name__ == "__main__":
    print(f"QuickReply is ready at http://{HOST}:{PORT}")
    print("Accounts and replies stay in this local project folder.")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
