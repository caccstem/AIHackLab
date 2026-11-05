# Options & Controls

Run the dashboard and same-origin ESP32 API proxy with:

```sh
python3 dev_server.py
```

Then open <http://localhost:8765/>. The proxy forwards dashboard requests to `http://esp32-3.local`, avoiding browser CORS restrictions. Connect this computer to the same Wi-Fi network as ESP32-3 for keypad and light responses.
