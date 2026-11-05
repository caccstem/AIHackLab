from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from pathlib import Path

ROOT = Path(__file__).parent
DEVICE = "http://esp32-3.local"
ALLOWED_ENDPOINTS = {
    "keypad/current",
    "keypad/last",
    "temperature",
    "yellow_light/on", "yellow_light/off", "yellow_light/state",
    "green_light/on", "green_light/off", "green_light/state",
    "blue_light/on", "blue_light/off", "blue_light/state",
    "red_light/on", "red_light/off", "red_light/state",
}


class DashboardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/device/"):
            endpoint = parsed.path.removeprefix("/device/")
            if endpoint not in ALLOWED_ENDPOINTS:
                self.send_error(404, "Unknown device endpoint")
                return
            self.proxy_device_request(endpoint)
            return
        super().do_GET()

    def proxy_device_request(self, endpoint):
        request = Request(
            f"{DEVICE}/{endpoint}",
            headers={"Cache-Control": "no-cache", "Pragma": "no-cache"},
            method="GET",
        )
        try:
            with urlopen(request, timeout=4) as response:
                body = response.read()
                status = response.status
                content_type = response.headers.get("Content-Type", "text/plain; charset=utf-8")
        except HTTPError as error:
            body = error.read()
            status = error.code
            content_type = error.headers.get("Content-Type", "text/plain; charset=utf-8")
        except (URLError, TimeoutError) as error:
            body = f"ESP32 request failed: {error}".encode()
            status = 502
            content_type = "text/plain; charset=utf-8"

        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    address = ("0.0.0.0", 8765)
    print(f"Options & Controls: http://localhost:{address[1]}/")
    print("ESP32 API requests are proxied through this local server.")
    ThreadingHTTPServer(address, DashboardHandler).serve_forever()
