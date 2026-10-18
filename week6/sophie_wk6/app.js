(() => {
  const adapter = window.deviceAdapter;
  const correctServer = window.location.protocol === 'http:' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname) &&
    window.location.port === '8000';
  if (!correctServer) {
    const notice = document.querySelector('.notice p');
    notice.replaceChildren();
    const message = document.createElement('strong');
    message.textContent = 'Open the local control server. ';
    const link = document.createElement('a');
    link.href = 'http://localhost:8000/';
    link.textContent = 'Go to http://localhost:8000';
    link.style.color = 'var(--accent)';
    notice.append(message, 'This preview cannot communicate with your boards. Keep python3 server.py running, then ', link, '.');
    document.querySelector('#all-off').disabled = true;
    document.querySelector('#updated').textContent = 'Waiting for the local control server';
    document.querySelector('footer > span').textContent = 'Device requests are paused';
    const guide = document.querySelector('#guide');
    document.querySelector('#connection-info').addEventListener('click', () => guide.showModal());
    document.querySelector('#close-guide').addEventListener('click', () => guide.close());
    return;
  }
  const colors = { red: '#ee827b', yellow: '#edcf75', blue: '#83b0eb', green: '#a4ce88' };
  const states = new Map();
  let selectedBoard = adapter.boards[0].id;
  const container = document.querySelector('#boards');
  const announce = message => { document.querySelector('#announcement').textContent = message; };
  for (const board of adapter.boards) {
    states.set(board.id, { history: [], data: null, online: false, busy: false, feedback: "" });
    const card = document.createElement('article');
    card.className = 'board'; card.id = board.id;
    card.innerHTML = `<div class="board-top"><span class="device-icon" aria-hidden="true">▦</span><div><h3>${board.name}</h3><span class="board-id">${board.id.toUpperCase()}</span></div><span class="board-status">● Checking</span></div>
      <div class="sensor-row"><div><span class="sensor-label">♧ &nbsp; Temperature</span><p class="reading temperature">—</p></div><div><span class="sensor-label">♧ &nbsp; Humidity</span><p class="reading humidity">—</p></div></div>
      <div class="chart-wrap"><div class="chart-label"><span>Temperature · recent readings</span><span>°C</span></div><svg viewBox="0 0 300 49" preserveAspectRatio="none" role="img" aria-label="Temperature history will appear as readings arrive"><path d="M0 45H300" stroke="#30372e"/><polyline fill="none" stroke="#cbe697" stroke-width="2" vector-effect="non-scaling-stroke"/></svg></div>
      <div class="board-bottom"><span class="board-message">Waiting for readings</span><span>LOCAL DEVICE</span></div>`;
    container.append(card);
  }
  const selector = document.querySelector('#board-selector');
  for (const board of adapter.boards) {
    const button = document.createElement('button');
    button.className = 'board-choice';
    button.textContent = board.name;
    button.dataset.board = board.id;
    button.addEventListener('click', () => {
      selectedBoard = board.id;
      renderLights();
    });
    selector.append(button);
  }
  const controls = document.querySelector('#light-controls');
  controls.innerHTML = Object.entries(colors).map(([color, hex]) => `
    <button class="light-tile" role="checkbox" aria-checked="mixed" data-color="${color}" style="--light-color:${hex}">
      <span class="lamp-halo" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M17 30c0-5-6-7-6-15a13 13 0 0 1 26 0c0 8-6 10-6 15M17 30h14M18 35h12M21 40h6M21 29V19l3 3 3-3v10"/></svg></span>
      <span class="tile-bottom"><span><span class="tile-name">${color[0].toUpperCase()+color.slice(1)}</span><span class="tile-state">Unknown</span></span><span class="tile-switch" aria-hidden="true"></span></span>
    </button>`).join('');
  controls.addEventListener('click', async event => {
    const button = event.target.closest('[data-color]');
    if (!button || states.get(selectedBoard).busy) return;
    // Capture the target before awaiting: switching boards never redirects a command.
    const id = selectedBoard;
    await command(id, [button.dataset.color], adapter.getLights(id)[button.dataset.color] !== true);
  });
  function renderLights() {
    const board = adapter.boards.find(b => b.id === selectedBoard);
    const state = states.get(selectedBoard);
    selector.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.board === selectedBoard)));
    document.querySelector('#lights-target').textContent = `Controlling ${board.name}`;
    document.querySelector('#light-feedback').textContent = state.busy ? `${board.name} · Sending command…` : state.feedback;
    controls.querySelectorAll('[data-color]').forEach(button => {
      const color = button.dataset.color;
      const value = adapter.getLights(selectedBoard)[color];
      button.disabled = state.busy;
      button.setAttribute('aria-checked', value === null ? 'mixed' : String(value));
      button.setAttribute('aria-label', `${board.name} ${color} light${value === null ? ', state unknown; activate to turn on' : ''}`);
      button.querySelector('.tile-state').textContent = value === null ? 'Unknown · tap to turn on' : value ? 'On · tap to turn off' : 'Off · tap to turn on';
    });
  }
  function render(id) {
    const state = states.get(id), card = document.getElementById(id), data = state.data;
    renderLights();
    renderSummary();
    if (!data || !state.online) {
      card.querySelector('.temperature').textContent = '—';
      card.querySelector('.humidity').textContent = '—';
      return;
    }
    card.querySelector('.temperature').innerHTML = `${data.temperature.toFixed(1)}<small>°C</small>`;
    card.querySelector('.humidity').innerHTML = `${data.humidity}<small>%</small>`;
    const h = state.history, min = Math.min(...h) - .3, max = Math.max(...h) + .3;
    card.querySelector('polyline').setAttribute('points', h.map((v,i) => `${i * 300 / Math.max(1,h.length-1)},${43-(v-min)/(max-min)*36}`).join(' '));
    card.querySelector('svg').setAttribute('aria-label', `${h.length} temperature readings; latest ${data.temperature} degrees Celsius`);
  }
  function renderSummary() {
    const available = [...states.values()].filter(s => s.data && s.online);
    document.querySelector('#board-count').innerHTML = `${available.length.toString().padStart(2,'0')}<small> / 03</small>`;
    document.querySelector('#average-temp').innerHTML = available.length ? `${(available.reduce((n,s)=>n+s.data.temperature,0)/available.length).toFixed(1)}<small> °C</small>` : '—';
    document.querySelector('#average-humidity').innerHTML = available.length ? `${Math.round(available.reduce((n,s)=>n+s.data.humidity,0)/available.length)}<small> %</small>` : '—';
    const values = adapter.boards.flatMap(b => Object.values(adapter.getLights(b.id)));
    document.querySelector('#light-count').innerHTML = `${values.filter(v=>v === true).length}<small> / 12 · ${values.filter(v=>v === null).length} unknown</small>`;
  }
  async function refresh(id, sample = true) {
    const state = states.get(id), card = document.getElementById(id);
    try {
      state.data = await adapter.read(id);
      state.online = true;
      card.querySelector(".board-status").textContent = "● Responding";
      if (sample) { state.history.push(state.data.temperature); state.history = state.history.slice(-24); }
      card.querySelector('.board-message').textContent = `Read at ${new Date().toLocaleTimeString()}`;
      render(id);
    } catch (error) {
      state.online = false;
      card.querySelector('.board-status').textContent = '○ Unavailable';
      card.querySelector('.board-message').textContent = `Sensors: ${error.message}. Check IoT Wi-Fi and local server. Retrying automatically.`;
      render(id);
      announce(`Unable to read ${id}.`);
    }
  }
  async function command(id, selectedColors, on) {
    const state = states.get(id); state.busy = true; render(id);
    try {
      const failures = [];
      for (const color of selectedColors) {
        try { await adapter.setLight(id, color, on); }
        catch (error) { failures.push(`${color}: ${error.message}`); }
      }
      if (failures.length) throw new Error(failures.join('; '));
      state.feedback = `${adapter.boards.find(b => b.id === id).name} · ${selectedColors.join(", ")} ${on ? "on" : "off"} — command accepted`;
      announce(`${id}: ${selectedColors.join(', ')} ${on ? 'on' : 'off'}; command accepted.`);
    } catch (error) {
      state.feedback = `Command unconfirmed: ${error.message}. Check IoT Wi-Fi and local server.`;
      announce(`Light command failed for ${id}. Please retry.`);
    } finally { state.busy = false; render(id); }
  }
  const allOff = document.querySelector('#all-off');
  allOff.addEventListener('click', async () => {
    if ([...states.values()].some(s => s.busy)) { announce('Please wait for the current update, then try again.'); return; }
    allOff.disabled = true;
    try { await Promise.all(adapter.boards.map(b => command(b.id, Object.keys(colors), false))); }
    finally { allOff.disabled = false; }
  });
  async function tick() {
    await Promise.all(adapter.boards.filter(b => !states.get(b.id).busy).map(b => refresh(b.id)));
    document.querySelector('#updated').textContent = `Last sensor check ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;
    setTimeout(tick, 5000);
  }
  const guide = document.querySelector('#guide');
  document.querySelector('#connection-info').addEventListener('click', () => guide.showModal());
  document.querySelector('#close-guide').addEventListener('click', () => guide.close());
  renderLights();
  renderSummary();
  tick();
})();
