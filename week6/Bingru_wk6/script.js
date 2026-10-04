const DEVICE = 'http://esp32-3.local';
const states = { yellow: false, green: false, blue: false, red: false };
const connection = document.querySelector('#connection');

function setConnection(online, message) {
  connection.className = online ? 'connection online' : 'connection offline';
  connection.querySelector('span').textContent = message;
}

function updateLight(color, isOn) {
  states[color] = isOn;
  document.querySelector(`[data-color="${color}"]`).classList.toggle('is-on', isOn);
  document.querySelector(`#${color}-status`).textContent = `Current status: ${isOn ? 'on' : 'off'}`;
}

async function request(path) {
  const response = await fetch(`${DEVICE}${path}`);
  if (!response.ok) throw new Error(`Device returned ${response.status}`);
  return response.text();
}

function parseState(value) {
  return /on|true|1/i.test(String(value));
}

async function readLight(color) {
  try {
    const value = await request(`/${color}_light/state`);
    updateLight(color, parseState(value));
    return true;
  } catch (error) {
    document.querySelector(`#${color}-status`).textContent = 'Current status: unavailable';
    return false;
  }
}

async function refreshStates() {
  connection.className = 'connection';
  connection.querySelector('span').textContent = 'Checking device...';
  const results = await Promise.all(['yellow', 'green', 'blue', 'red'].map(readLight));
  setConnection(results.some(Boolean), results.some(Boolean) ? 'Device connected' : 'Device unavailable');
}

async function toggleLight(color) {
  const nextState = !states[color];
  const button = document.querySelector(`[data-color="${color}"] .control-button`);
  button.disabled = true;
  try {
    await request(`/${color}_light/${nextState ? 'on' : 'off'}`);
    updateLight(color, nextState);
    setConnection(true, 'Device connected');
  } catch (error) {
    document.querySelector(`#${color}-status`).textContent = 'Current status: unavailable';
    setConnection(false, 'Device unavailable');
  } finally { button.disabled = false; }
}

async function readTemperature() {
  const status = document.querySelector('#temperature-status');
  const button = document.querySelector('[data-action="temperature"]');
  status.textContent = 'Current temperature: checking...';
  button.disabled = true;
  try {
    const value = await request('/teperature');
    status.textContent = `Current temperature: ${value.trim()}`;
    setConnection(true, 'Device connected');
  } catch (error) {
    status.textContent = 'Current temperature: unavailable';
    setConnection(false, 'Device unavailable');
  } finally { button.disabled = false; }
}

document.querySelectorAll('[data-action="light"]').forEach(button => button.addEventListener('click', () => toggleLight(button.dataset.color)));
document.querySelector('[data-action="temperature"]').addEventListener('click', readTemperature);
document.querySelector('#refresh').addEventListener('click', refreshStates);
refreshStates();