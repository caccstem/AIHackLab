"""Run with python3 server.py, then visit http://127.0.0.1:8766."""

import json
import math
import re
from html.parser import HTMLParser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, ProxyHandler, build_opener

PORT = 8766
# The ESP32 renders sensor readings in its home page.
SENSOR_PATH = "/"
COLORS = ('red', 'yellow', 'blue', 'green')
ENDPOINTS = {
    f'/api/light/{color}/{action}': f'http://esp32-2.local/{color}_light/{action}'
    for color in COLORS for action in ('on', 'off')
}
# Preserve older red-light page requests.
ENDPOINTS.update({f'/api/light/{action}': ENDPOINTS[f'/api/light/red/{action}']
                  for action in ('on', 'off')})
HOSTS = {f'127.0.0.1:{PORT}', f'localhost:{PORT}'}
PAGE = Path(__file__).with_name('index.html')


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class SensorPageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.text = []

    def handle_data(self, data):
        self.text.append(data)


def parse_readings(html):
    parser = SensorPageParser()
    parser.feed(html)
    text = ' '.join(parser.text)
    number = r'([-+]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+))'
    temperature = re.search(r'Temperature\s*:\s*' + number + r'\s*°\s*C', text, re.I)
    humidity = re.search(r'Humidity\s*:\s*' + number + r'\s*%', text, re.I)
    if temperature is None or humidity is None:
        raise ValueError('Missing sensor readings')
    temperature = float(temperature.group(1))
    humidity = float(humidity.group(1))
    if not math.isfinite(temperature) or not math.isfinite(humidity) or not 0 <= humidity <= 100:
        raise ValueError('Invalid sensor readings')
    return {'temperature_c': temperature, 'humidity': humidity}


class Handler(BaseHTTPRequestHandler):
    def respond(self, code, body, content_type='application/json'):
        data = body if isinstance(body, bytes) else json.dumps(body).encode()
        self.send_response(code)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.headers.get('Host') not in HOSTS:
            self.respond(403, {'error': 'Use the local control address.'})
        elif self.path == '/api/readings':
            self.read_sensors()
        elif self.path in ('/', '/index.html'):
            self.respond(200, PAGE.read_bytes(), 'text/html; charset=utf-8')
        else:
            self.respond(404, {'error': 'Not found.'})

    def read_sensors(self):
        try:
            with build_opener(ProxyHandler({}), NoRedirect()).open(
                    'http://esp32-2.local' + SENSOR_PATH, timeout=8) as response:
                html = response.read(65536).decode('utf-8')
            self.respond(200, parse_readings(html))
        except (ValueError, KeyError, TypeError):
            self.respond(502, {'error': 'The sensor response does not contain valid temperature and humidity readings.'})
        except (URLError, OSError):
            self.respond(502, {'error': 'Cannot reach the ESP32 sensor. Check its network connection.'})

    def do_POST(self):
        host = self.headers.get('Host')
        if (host not in HOSTS
                or self.headers.get('Origin') != f'http://{host}'
                or self.headers.get('X-Light-Control') != '1'):
            self.respond(403, {'error': 'Send commands from the local control page.'})
            return
        endpoint = ENDPOINTS.get(self.path)
        if endpoint is None:
            self.respond(404, {'error': 'Unknown light command.'})
            return
        try:
            # Only the configured light endpoints are reachable through this server.
            # Avoid system HTTP proxies and redirects for local device commands.
            with build_opener(ProxyHandler({}), NoRedirect()).open(endpoint, timeout=8) as response:
                if not 200 <= response.status < 300:
                    self.respond(502, {'error': f'Device returned HTTP {response.status}.'})
                    return
            self.respond(200, {'ok': True})
        except HTTPError as error:
            self.respond(502, {'error': f'Device returned HTTP {error.code}.'})
        except (URLError, OSError, TimeoutError):
            self.respond(502, {'error': f'Could not confirm a response from {endpoint}. Check device power, Wi-Fi, and hostname. The command may have reached the device.'})


if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    print(f'Light control running at http://127.0.0.1:{PORT}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
