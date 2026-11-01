"""Local API and static server for QuickReply. Run: python3 server.py"""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import uuid


ROOT = Path(__file__).resolve().parent
WEB = ROOT / "web"
DATA = ROOT / "data" / "rules.json"
HOST = "127.0.0.1"
PORT = 8766


def read_rules():
    if not DATA.exists():
        return []
    try:
        rules = json.loads(DATA.read_text(encoding="utf-8"))
        return rules if isinstance(rules, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def write_rules(rules):
    DATA.parent.mkdir(parents=True, exist_ok=True)
    temp = DATA.with_suffix(".tmp")
    temp.write_text(json.dumps(rules, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temp.replace(DATA)


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
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        if not self.allowed_origin():
            return self.send_error(403)
        self.send_json({"ok": True})

    def do_GET(self):
        if self.path.split("?", 1)[0] == "/api/rules":
            return self.send_json({"rules": read_rules()})
        if self.path.split("?", 1)[0] == "/api/health":
            return self.send_json({"ok": True})

        path = (WEB / self.path.lstrip("/")).resolve()
        if self.path == "/":
            path = WEB / "index.html"
        if not path.is_relative_to(WEB.resolve()) or not path.is_file():
            self.send_error(404)
            return
        content_type = "text/html; charset=utf-8" if path.suffix == ".html" else "text/css; charset=utf-8" if path.suffix == ".css" else "text/javascript; charset=utf-8"
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if self.path.split("?", 1)[0] != "/api/rules":
            return self.send_json({"error": "Not found"}, 404)
        if self.headers.get("Origin") and not self.allowed_origin():
            return self.send_json({"error": "Origin not allowed"}, 403)
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length > 1_000_000:
                return self.send_json({"error": "Request too large"}, 413)
            payload = json.loads(self.rfile.read(length))
            rules = payload.get("rules") if isinstance(payload, dict) else None
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
            write_rules(cleaned)
            return self.send_json({"rules": cleaned})
        except (ValueError, OSError) as error:
            return self.send_json({"error": str(error)}, 400)

    def log_message(self, _format, *_args):
        pass


if __name__ == "__main__":
    print(f"QuickReply is ready at http://{HOST}:{PORT}")
    print("Keep this server running while using the dashboard and Gmail extension.")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
