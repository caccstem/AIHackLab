/* Configure board hostnames in server.py. Start it with python3 server.py.
   Only user clicks send light commands. Sensor polling is read-only. */
(() => {
  const colors = ['red', 'yellow', 'blue', 'green'];
  const boards = [1, 2, 3].map(n => ({
    id: `board-0${n}`, name: `Board 0${n}`, baseUrl: `/api/board-0${n}`
  }));
  const lights = Object.fromEntries(boards.map(b => [b.id, Object.fromEntries(colors.map(c => [c, null]))]));
  function get(id) {
    const board = boards.find(b => b.id === id);
    if (!board) throw new Error('Unknown board');
    return board;
  }
  async function request(url, command = false) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store', method: command ? 'POST' : 'GET', headers: command ? {'X-Luma-Control': '1'} : {} });
      if (!response.ok) {
        let message = `HTTP ${response.status}. Start server.py and open localhost:8000`;
        try { const body = await response.json(); message = body.error || message; } catch {}
        throw new Error(message);
      }
      return await response.text();
    } finally { clearTimeout(timer); }
  }
  function sensorValue(text, key) {
    let value;
    try { value = JSON.parse(text); } catch { value = text; }
    if (value && typeof value === 'object') value = value[key] ?? value.value;
    if (typeof value === 'string') {
      const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*(?:°?\s*C|%)?$/i);
      if (!match) throw new Error(`Unexpected ${key} response`);
      value = Number(match[1]);
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || (key === 'humidity' && (value < 0 || value > 100))) {
      throw new Error(`Invalid ${key} reading`);
    }
    return value;
  }
  window.deviceAdapter = {
    mode: 'live', boards,
    getLights(id) { get(id); return {...lights[id]}; },
    async read(id) {
      const board = get(id);
      const [temperature, humidity] = await Promise.all(['temperature', 'humidity'].map(async key => sensorValue(await request(`${board.baseUrl}/${key}`), key)));
      return {temperature, humidity};
    },
    async setLight(id, color, on) {
      const board = get(id);
      if (!colors.includes(color) || typeof on !== 'boolean') throw new Error('Invalid light command');
      try {
        await request(`${board.baseUrl}/${color}_light/${on ? 'on' : 'off'}`, true);
        lights[id][color] = on;
      } catch (error) {
        lights[id][color] = null; // A timed-out command may still have reached the hardware.
        throw error;
      }
    }
  };
})();
