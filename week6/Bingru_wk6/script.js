const DEVICE = 'http://esp32-3.local';
const savedStates = JSON.parse(localStorage.getItem('esp32-light-states') || '{}');
const states = Object.fromEntries(['yellow', 'green', 'blue', 'red'].map(color => [color, savedStates[color] === true]));
const connection = document.querySelector('#connection');

function setConnection(online, message) {
  connection.className = online ? 'connection online' : 'connection offline';
  connection.querySelector('span').textContent = message;
}

function updateLight(color, isOn) {
  states[color] = isOn;
  localStorage.setItem('esp32-light-states', JSON.stringify(states));
  document.querySelector(`[data-color="${color}"]`).classList.toggle('is-on', isOn);
  document.querySelector(`#${color}-status`).textContent = `Current status: ${isOn ? 'on' : 'off'}`;
}

Object.entries(states).forEach(([color, isOn]) => updateLight(color, isOn));

async function request(path) {
  const response = await fetch(`${DEVICE}${path}`);
  if (!response.ok) throw new Error(`Device returned ${response.status}`);
  return response.text();
}

async function sendLightCommand(color, command) {
  await fetch(`${DEVICE}/${color}_light/${command}`, {
    method: 'GET',
    mode: 'no-cors',
    cache: 'no-store'
  });
}

function parseState(value) {
  let state = value;
  try {
    const response = JSON.parse(value);
    if (response.status !== undefined) state = response.status;
  } catch (error) {
    // The device may return a plain-text state instead of JSON.
  }
  const normalized = String(state).trim().toLowerCase();
  if (['on', 'true', '1'].includes(normalized)) return true;
  if (['off', 'false', '0'].includes(normalized)) return false;
  throw new Error(`Unrecognized light state: ${state}`);
}

async function readLight(color) {
  try {
    const value = await request(`/${color}_light/state`);
    updateLight(color, parseState(value));
    return true;
  } catch (error) {
    // Keep the last-known state; CORS may prevent reading this endpoint.
    return false;
  }
}

async function refreshStates() {
  connection.className = 'connection';
  connection.querySelector('span').textContent = 'Checking device...';
  const results = await Promise.all(['yellow', 'green', 'blue', 'red'].map(readLight));
  setConnection(results.some(Boolean), results.some(Boolean) ? 'Device connected' : 'Device unavailable');
}

async function setLight(color, command, button) {
  button.disabled = true;
  try {
    await sendLightCommand(color, command);
    updateLight(color, command === 'on');
    setConnection(true, 'Light command sent');
  } catch (error) {
    document.querySelector(`#${color}-status`).textContent = 'Current status: command failed';
    setConnection(false, 'Device unavailable');
  } finally { button.disabled = false; }
}

async function readTemperature() {
  const status = document.querySelector('#temperature-status');
  const button = document.querySelector('[data-action="temperature"]');
  status.textContent = 'Current temperature: checking...';
  button.disabled = true;
  try {
    const value = await request('/temperature');
    const result = JSON.parse(value);
    const temperature = Number(result.temperature);
    if (!Number.isFinite(temperature)) throw new Error('Temperature sensor returned an invalid reading');
    status.textContent = `Current temperature: ${temperature} °C`;
    setConnection(true, 'Device connected');
  } catch (error) {
    status.textContent = 'Current temperature: unavailable';
    setConnection(false, 'Device unavailable');
  } finally { button.disabled = false; }
}

document.querySelectorAll('[data-action="light"]').forEach(button => button.addEventListener('click', () => setLight(button.dataset.color, button.dataset.command, button)));
document.querySelector('[data-action="temperature"]').addEventListener('click', readTemperature);
document.querySelector('#refresh').addEventListener('click', refreshStates);
refreshStates();