"""Run with python3 server.py; open http://localhost:8000. No packages needed."""
import json
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import URLError, HTTPError
from urllib.request import Request, build_opener, ProxyHandler, HTTPRedirectHandler

ROOT = Path(__file__).resolve().parent
# Change these if boards 2 and 3 use bare hostnames or numeric IP addresses.
BOARDS = {f'board-0{n}': f'http://esp32-{n}.local' for n in (1, 2, 3)}
ASSETS = {'/': ('index.html', 'text/html'), '/index.html': ('index.html', 'text/html'),
          '/styles.css': ('styles.css', 'text/css'), '/devices.js': ('devices.js', 'text/javascript'),
          '/app.js': ('app.js', 'text/javascript')}
ROUTE = re.compile(r'^/api/(board-0[123])/(temperature|humidity|(?:red|yellow|blue|green)_light/(?:on|off))$')

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

class Handler(BaseHTTPRequestHandler):
    def reply(self, status, body, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)

    def error(self, status, message):
        self.reply(status, json.dumps({'error': message}).encode())

    def handle_request(self):
        # Restrict this local gateway to its own page and explicit device routes.
        if self.headers.get('Host') not in ('localhost:8000', '127.0.0.1:8000'):
            self.error(403, 'Use http://localhost:8000')
            return
        origin = self.headers.get('Origin')
        if origin and origin != 'http://' + self.headers['Host']:
            self.error(403, 'Open the dashboard on this server')
            return
        if self.headers.get('Sec-Fetch-Site') == 'cross-site':
            self.error(403, 'Cross-site requests are not allowed')
            return
        match = ROUTE.fullmatch(self.path)
        if match:
            board, route = match.groups()
            is_light = '_light/' in route
            if self.command != ('POST' if is_light else 'GET'):
                self.error(405, 'Use POST for lights and GET for sensors')
                return
            if is_light and self.headers.get('X-Luma-Control') != '1':
                self.error(403, 'Light requests must come from the dashboard')
                return
            try:
                # Ignore environment HTTP proxies for local IoT traffic.
                opener = build_opener(ProxyHandler({}), NoRedirect())
                with opener.open(Request(BOARDS[board] + '/' + route, method='GET'), timeout=4) as response:
                    body = response.read(65537)
                    if len(body) > 65536:
                        self.error(502, 'Board response is too large')
                        return
                    self.reply(200, body, response.headers.get('Content-Type', 'text/plain'))
            except (URLError, HTTPError, TimeoutError, OSError) as exc:
                self.error(502, f'{board} is unreachable or returned an error: {exc}')
            return
        if self.command == 'GET' and self.path in ASSETS:
            filename, content_type = ASSETS[self.path]
            self.reply(200, (ROOT / filename).read_bytes(), content_type + '; charset=utf-8')
        else:
            self.error(404, 'Unknown route')

    def do_GET(self):
        try:
            self.handle_request()
        except (BrokenPipeError, ConnectionResetError):
            pass

    do_POST = do_GET

if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 8000), Handler)
    print('Luma is ready: http://localhost:8000 — Ctrl+C to stop', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
