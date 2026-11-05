const savedStates = JSON.parse(localStorage.getItem('esp32-light-states') || '{}');
const states = Object.fromEntries(['yellow', 'green', 'blue', 'red'].map(color => [color, savedStates[color] === true]));
const connection = document.querySelector('#connection');
const keypadStatus = document.querySelector('#keypad-status');
const keyDisplay = document.querySelector('#key-display');
let keypadPollBusy = false;
let keypadInitialized = false;
let previousCurrentKey = null;
let previousLastKey = null;
let enteredPatternCode = '';
let patternRunning = false;
const LIGHT_COLORS = ['yellow', 'green', 'blue', 'red'];
const PATTERN_CODE = '2872';
const patternSequence = [];
let lastPatternClickAt = null;
let designerIsPlaying = false;

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
  const response = await fetch(`/device${path}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Device returned ${response.status}`);
  return response.text();
}

async function sendLightCommand(color, command) {
  const response = await fetch(`/device/${color}_light/${command}`, {
    method: 'GET',
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`Could not turn ${color} ${command}: ${response.status}`);
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

function extractKey(responseText) {
  let response = responseText;
  try { response = JSON.parse(responseText); } catch (error) { /* Endpoint may return plain text. */ }

  const keyFields = ['current', 'currentkey', 'currentbutton', 'currentkeypressed', 'last', 'lastkey', 'lastbutton', 'lastkeypressed', 'keypressed', 'keypadkey', 'keypadvalue', 'keyvalue', 'key', 'button', 'value', 'data'];
  function findKey(value) {
    if (typeof value === 'string' || typeof value === 'number') {
      const normalized = String(value).trim();
      if (/^[0-9*#]$/.test(normalized)) return normalized;
      if (/^(none|null|undefined|no key|idle|[-]|-1)$/i.test(normalized)) return null;
      return normalized.match(/(?:^|[^0-9])([0-9*#])(?:$|[^0-9])/)?.[1] ?? null;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const match = findKey(item);
        if (match !== null) return match;
      }
      return null;
    }
    if (value && typeof value === 'object') {
      const entries = Object.entries(value);
      for (const [name, item] of entries) {
        if (keyFields.includes(name.toLowerCase())) {
          const match = findKey(item);
          if (match !== null) return match;
        }
      }
      for (const [, item] of entries) {
        const match = findKey(item);
        if (match !== null) return match;
      }
    }
    return null;
  }
  return findKey(response);
}

async function refreshLastKey() {
  if (keypadPollBusy) return;
  keypadPollBusy = true;
  try {
    const [currentResult, lastResult] = await Promise.allSettled([
      request('/keypad/current'),
      request('/keypad/last')
    ]);
    const currentKey = currentResult.status === 'fulfilled' ? extractKey(currentResult.value) : null;
    const lastKey = lastResult.status === 'fulfilled' ? extractKey(lastResult.value) : null;
    if (currentResult.status === 'rejected' && lastResult.status === 'rejected') {
      throw new Error('Both keypad endpoints failed');
    }
    const displayedKey = currentKey ?? lastKey;
    keyDisplay.textContent = displayedKey ?? '—';
    keyDisplay.setAttribute('aria-label', displayedKey ? `Latest key pressed: ${displayedKey}` : 'No key pressed yet');

    if (!keypadInitialized) {
      keypadInitialized = true;
      previousCurrentKey = currentKey;
      previousLastKey = lastKey;
      if (currentKey) handleKeyPress(currentKey);
    } else {
      const currentChanged = currentKey !== null && currentKey !== previousCurrentKey;
      const lastChanged = lastKey !== null && lastKey !== previousLastKey;
      if (currentChanged) {
        handleKeyPress(currentKey);
      } else if (lastChanged) {
        handleKeyPress(lastKey);
      }
      previousCurrentKey = currentKey;
      previousLastKey = lastKey;
    }
    if (!patternRunning) keypadStatus.textContent = enteredPatternCode ? `Code: ${enteredPatternCode} — press # to run` : 'ESP32 keypad connected';
  } catch (error) {
    keypadStatus.textContent = 'Keypad unavailable — check ESP32-3 connection';
  } finally {
    keypadPollBusy = false;
  }
}

function handleKeyPress(key) {
  if (key === '*') {
    enteredPatternCode = '';
    if (!patternRunning) keypadStatus.textContent = 'Code cleared';
    return;
  }
  if (key === '#') {
    if (enteredPatternCode === PATTERN_CODE) {
      enteredPatternCode = '';
      runLightPattern();
    } else {
      enteredPatternCode = '';
      if (!patternRunning) keypadStatus.textContent = 'Incorrect code. Enter 2872, then #.';
    }
    return;
  }
  if (/^\d$/.test(key) && !patternRunning) {
    enteredPatternCode = (enteredPatternCode + key).slice(-PATTERN_CODE.length);
    keypadStatus.textContent = `Code: ${enteredPatternCode} — press # to run`;
  }
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function setAllLights(command) {
  const results = await Promise.allSettled(LIGHT_COLORS.map(color => sendLightCommand(color, command)));
  if (results.some(result => result.status === 'rejected')) {
    throw new Error(`Failed to turn all lights ${command}`);
  }
  LIGHT_COLORS.forEach(color => updateLight(color, command === 'on'));
}

async function runLightPattern() {
  if (patternRunning) return;
  patternRunning = true;
  enteredPatternCode = '';
  keypadStatus.textContent = 'Cool pattern starting!';
  try {
    for (let cycle = 1; cycle <= 3; cycle += 1) {
      keypadStatus.textContent = `Pattern ${cycle}/3 — lights on`;
      await setAllLights('on');
      await wait(1000);
      keypadStatus.textContent = `Pattern ${cycle}/3 — lights off`;
      await setAllLights('off');
      await wait(1000);
    }
    keypadStatus.textContent = 'Pattern complete! Enter 2872, then # to play again.';
  } catch (error) {
    keypadStatus.textContent = 'Pattern failed — check ESP32-3 connection';
    setConnection(false, 'Device unavailable');
  } finally {
    await Promise.allSettled(LIGHT_COLORS.map(color => sendLightCommand(color, 'off')));
    LIGHT_COLORS.forEach(color => updateLight(color, false));
    patternRunning = false;
  }
}

async function setLight(color, command, button) {
  if (patternRunning || designerIsPlaying) return;
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

function renderPatternSequence() {
  const sequenceDisplay = document.querySelector('#pattern-sequence');
  if (!patternSequence.length) {
    sequenceDisplay.textContent = 'Your pattern will appear here.';
    return;
  }
  sequenceDisplay.textContent = patternSequence.map((step, index) => {
    const gap = index === 0 ? 'Start' : `${(step.delay / 1000).toFixed(1)}s later`;
    return `${index + 1}. ${step.color} (${gap})`;
  }).join('  →  ');
}

function recordPatternColor(color) {
  if (designerIsPlaying || patternRunning) return;
  const now = performance.now();
  const delay = lastPatternClickAt === null ? 0 : Math.max(0, now - lastPatternClickAt);
  patternSequence.push({ color, delay });
  lastPatternClickAt = now;
  renderPatternSequence();
  document.querySelector('#pattern-status').textContent = `${color[0].toUpperCase()}${color.slice(1)} added. Keep tapping to record your rhythm.`;
}

async function playDesignedPattern() {
  if (designerIsPlaying || patternRunning) return;
  if (!patternSequence.length) {
    document.querySelector('#pattern-status').textContent = 'Choose at least one color first.';
    return;
  }

  designerIsPlaying = true;
  const status = document.querySelector('#pattern-status');
  const playButton = document.querySelector('#play-pattern');
  const clearButton = document.querySelector('#clear-pattern');
  const colorButtons = document.querySelectorAll('[data-pattern-color]');
  playButton.disabled = true;
  clearButton.disabled = true;
  colorButtons.forEach(button => { button.disabled = true; });
  status.textContent = 'Playing your pattern...';

  try {
    await Promise.all(LIGHT_COLORS.map(color => sendLightCommand(color, 'off')));
    LIGHT_COLORS.forEach(color => updateLight(color, false));

    for (let index = 0; index < patternSequence.length; index += 1) {
      const step = patternSequence[index];
      if (index > 0) await wait(step.delay);
      if (index > 0) {
        const previousColor = patternSequence[index - 1].color;
        await sendLightCommand(previousColor, 'off');
        updateLight(previousColor, false);
      }
      await sendLightCommand(step.color, 'on');
      updateLight(step.color, true);
      status.textContent = `Playing ${index + 1} of ${patternSequence.length}: ${step.color}`;
    }

    await wait(1000);
    await sendLightCommand(patternSequence[patternSequence.length - 1].color, 'off');
    updateLight(patternSequence[patternSequence.length - 1].color, false);
    status.textContent = 'Pattern finished! Press Play to see it again.';
  } catch (error) {
    status.textContent = 'Could not play pattern — check the ESP32 connection.';
    setConnection(false, 'Device unavailable');
    await Promise.allSettled(LIGHT_COLORS.map(color => sendLightCommand(color, 'off')));
    LIGHT_COLORS.forEach(color => updateLight(color, false));
  } finally {
    designerIsPlaying = false;
    playButton.disabled = false;
    clearButton.disabled = false;
    colorButtons.forEach(button => { button.disabled = false; });
  }
}

function clearDesignedPattern() {
  if (designerIsPlaying || patternRunning) return;
  patternSequence.length = 0;
  lastPatternClickAt = null;
  renderPatternSequence();
  document.querySelector('#pattern-status').textContent = 'Pattern cleared. Press colors to record a new one.';
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
document.querySelectorAll('[data-pattern-color]').forEach(button => button.addEventListener('click', () => recordPatternColor(button.dataset.patternColor)));
document.querySelector('#play-pattern').addEventListener('click', playDesignedPattern);
document.querySelector('#clear-pattern').addEventListener('click', clearDesignedPattern);
refreshStates();
refreshLastKey();
setInterval(refreshLastKey, 150);