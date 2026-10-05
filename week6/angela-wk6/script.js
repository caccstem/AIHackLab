const cards = [...document.querySelectorAll('.light-card')];
const toast = document.querySelector('#toast');
const count = document.querySelector('#on-count');
const updated = document.querySelector('#updated-time');
const menu = document.querySelector('#preset-menu');
const connectionForm = document.querySelector('#connection-form');
const addressInput = document.querySelector('#esp32-address');
const connectButton = document.querySelector('#connect-button');
const connectionMessage = document.querySelector('#connection-message');
const statusDot = document.querySelector('#status-dot');
const statusTitle = document.querySelector('#device-status-title');
const statusDetail = document.querySelector('#device-status-detail');
const deviceAddressLabel = document.querySelector('#device-address-label');
const LIGHT_STATE_KEY = 'luma-node-lights';
const ESP32_ADDRESS_KEY = 'luma-node-esp32-address';
let toastTimer;
let selectedPreset = null;
let esp32BaseUrl = '';
let esp32Connected = false;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function saveState() {
  localStorage.setItem(LIGHT_STATE_KEY, JSON.stringify(cards.map(card => card.querySelector('input').checked)));
}

function renderCard(card, announce = false) {
  const input = card.querySelector('input');
  card.classList.toggle('is-on', input.checked);
  card.querySelector('.state').textContent = input.checked ? 'ON' : 'OFF';
  input.setAttribute('aria-label', card.dataset.light + ' light ' + (input.checked ? 'on' : 'off'));
  count.textContent = cards.filter(item => item.querySelector('input').checked).length;
  if (announce) showToast(card.querySelector('h3').textContent + ' light ' + (input.checked ? 'on' : 'off'));
}

function setConnectionStatus(state, message) {
  statusDot.className = 'status-dot ' + state;
  statusTitle.textContent = state === 'connected' ? 'Connected to ESP32' : state === 'checking' ? 'Connecting…' : 'Not connected';
  statusDetail.textContent = message;
}

function normalizeAddress(value) {
  let address = value.trim();
  if (!address) return '';
  if (!/^https?:\/\//i.test(address)) address = 'http://' + address;
  return address.replace(/\/+$/, '');
}

async function connectToEsp32(event) {
  event.preventDefault();
  const address = normalizeAddress(addressInput.value);
  if (!address) {
    connectionMessage.textContent = 'Enter the ESP32 IP address or hostname first.';
    connectionMessage.className = 'error';
    return;
  }
  connectButton.disabled = true;
  connectButton.textContent = 'Testing…';
  connectionMessage.textContent = 'Trying to reach your ESP32…';
  connectionMessage.className = '';
  setConnectionStatus('checking', address);
  try {
    const response = await fetch(address + '/api/status', { method: 'GET', mode: 'cors' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    esp32BaseUrl = address;
    esp32Connected = true;
    localStorage.setItem(ESP32_ADDRESS_KEY, address);
    deviceAddressLabel.textContent = address.replace(/^https?:\/\//i, '');
    setConnectionStatus('connected', 'Ready for light commands');
    connectionMessage.textContent = 'Connected. Your light controls are live.';
    connectionMessage.className = 'success';
    updated.textContent = 'just now';
    showToast('ESP32 connected');
  } catch {
    esp32Connected = false;
    setConnectionStatus('disconnected', 'Could not reach this address');
    connectionMessage.textContent = 'Connection failed. Check the address, router, and ESP32 server.';
    connectionMessage.className = 'error';
    showToast('Could not connect to ESP32');
  } finally {
    connectButton.disabled = false;
    connectButton.textContent = 'Connect';
  }
}

async function sendLightCommand(card) {
  if (!esp32Connected) return;
  const channel = cards.indexOf(card) + 1;
  const isOn = card.querySelector('input').checked;
  try {
    const response = await fetch(esp32BaseUrl + '/api/lights/' + channel, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on: isOn, color: card.dataset.light }),
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    updated.textContent = 'just now';
  } catch {
    esp32Connected = false;
    setConnectionStatus('disconnected', 'Light command failed');
    showToast('ESP32 did not accept that command');
  }
}

function setLights(names, message) {
  cards.forEach(card => {
    card.querySelector('input').checked = names.includes(card.dataset.light);
    renderCard(card);
    sendLightCommand(card);
  });
  saveState();
  updated.textContent = 'just now';
  showToast(message);
}

function turnOffLights(names, message) {
  cards.forEach(card => {
    if (names.includes(card.dataset.light)) {
      card.querySelector('input').checked = false;
      renderCard(card);
      sendLightCommand(card);
    }
  });
  saveState();
  updated.textContent = 'just now';
  showToast(message);
}

function hidePresetMenu() {
  menu.hidden = true;
  selectedPreset = null;
}

let stored = [];
try { stored = JSON.parse(localStorage.getItem(LIGHT_STATE_KEY) || '[]'); } catch { stored = []; }
cards.forEach((card, index) => {
  const input = card.querySelector('input');
  input.checked = stored[index] === true;
  input.addEventListener('change', () => {
    renderCard(card, true);
    saveState();
    sendLightCommand(card);
  });
  renderCard(card);
});

document.querySelectorAll('[data-scene]').forEach(card => {
  card.addEventListener('contextmenu', event => {
    event.preventDefault();
    selectedPreset = card;
    menu.hidden = false;
    menu.style.left = Math.min(event.clientX, window.innerWidth - 150) + 'px';
    menu.style.top = Math.min(event.clientY, window.innerHeight - 100) + 'px';
  });
});

connectionForm.addEventListener('submit', connectToEsp32);
document.querySelectorAll('[data-scene]').forEach(scene => scene.addEventListener('click', () => {
  const scenes = {
    focus: ['yellow', 'green'],
    sunset: ['red', 'blue'],
    all: cards.map(card => card.dataset.light),
    off: [],
  };
  const wasActive = scene.classList.contains('active');
  document.querySelectorAll('.scene').forEach(item => item.classList.remove('active'));
  if (wasActive) {
    turnOffLights(scenes[scene.dataset.scene], scene.querySelector('strong').textContent + ' preset deselected');
    return;
  }
  scene.classList.add('active');
  setLights(scenes[scene.dataset.scene], scene.querySelector('strong').textContent + ' preset activated');
}));

menu.addEventListener('click', event => {
  const action = event.target.closest('[data-preset-action]')?.dataset.presetAction;
  if (!action || !selectedPreset) return;
  if (action === 'edit') {
    const name = window.prompt('Preset name', selectedPreset.querySelector('strong').textContent);
    if (name?.trim()) {
      selectedPreset.querySelector('strong').textContent = name.trim();
      showToast('Preset renamed');
    }
  }
  if (action === 'delete') {
    const name = selectedPreset.querySelector('strong').textContent;
    if (window.confirm('Delete the ' + name + ' preset?')) {
      selectedPreset.remove();
      showToast(name + ' preset deleted');
    }
  }
  hidePresetMenu();
});
document.addEventListener('click', event => {
  if (!menu.hidden && !menu.contains(event.target)) hidePresetMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') hidePresetMenu();
});

document.querySelector('#all-off-button').addEventListener('click', () => setLights([], 'All lights turned off'));
document.querySelector('#refresh-button').addEventListener('click', () => {
  if (esp32BaseUrl) connectionForm.requestSubmit();
  else showToast('Enter your ESP32 address first');
});
const settingsButton = document.querySelector('#settings-button');
const welcomeTitle = document.querySelector('.welcome h1');
if (welcomeTitle?.firstChild?.nodeType === Node.TEXT_NODE) {
  const roomTitle = document.createElement('span');
  roomTitle.className = 'room-title-accent';
  roomTitle.textContent = welcomeTitle.firstChild.textContent;
  welcomeTitle.firstChild.replaceWith(roomTitle);
}
settingsButton.textContent = '⚙';
settingsButton.classList.add('gear-button');
const appearanceMenu = document.createElement('div');
appearanceMenu.className = 'appearance-menu';
appearanceMenu.hidden = true;
appearanceMenu.innerHTML = '<p>Appearance</p><button type="button" data-theme="light">Light</button><button type="button" data-theme="dark">Dark</button>';
document.body.append(appearanceMenu);
const THEME_KEY = 'luma-node-theme';

function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.body.classList.toggle('dark-mode', nextTheme === 'dark');
  document.documentElement.classList.toggle('dark-mode', nextTheme === 'dark');
  localStorage.setItem(THEME_KEY, nextTheme);
  appearanceMenu.querySelectorAll('[data-theme]').forEach(button => button.classList.toggle('selected', button.dataset.theme === nextTheme));
}

applyTheme(localStorage.getItem(THEME_KEY));
settingsButton.addEventListener('click', event => {
  event.stopPropagation();
  appearanceMenu.hidden = !appearanceMenu.hidden;
  const rect = settingsButton.getBoundingClientRect();
  appearanceMenu.style.top = rect.bottom + 8 + 'px';
  appearanceMenu.style.right = Math.max(16, window.innerWidth - rect.right) + 'px';
});
appearanceMenu.addEventListener('click', event => {
  const theme = event.target.closest('[data-theme]')?.dataset.theme;
  if (!theme) return;
  applyTheme(theme);
  appearanceMenu.hidden = true;
});
document.addEventListener('click', event => {
  if (!appearanceMenu.hidden && !appearanceMenu.contains(event.target) && event.target !== settingsButton) appearanceMenu.hidden = true;
});
document.querySelector('#custom-button').addEventListener('click', () => showToast('Preset builder is coming soon'));

const savedAddress = localStorage.getItem(ESP32_ADDRESS_KEY);
if (savedAddress) {
  addressInput.value = savedAddress;
  deviceAddressLabel.textContent = savedAddress.replace(/^https?:\/\//i, '');
}

const piano = document.querySelector('#piano');
const notationNotes = document.querySelector('#notation-notes');
const emptyScore = document.querySelector('#empty-score');
const noteLengthMenu = document.querySelector('#note-length-menu');
const createTuneButton = document.querySelector('#create-tune-button');
const clearTuneButton = document.querySelector('#clear-tune-button');
const saveTuneButton = document.querySelector('#save-tune-button');
const playTuneButton = document.querySelector('#play-tune-button');
const tempoBpm = document.createElement('input');
tempoBpm.id = 'tempo-bpm';
tempoBpm.type = 'number';
tempoBpm.min = '40';
tempoBpm.max = '240';
tempoBpm.step = '1';
tempoBpm.value = '120';
tempoBpm.inputMode = 'numeric';
const tempoLabel = document.createElement('label');
tempoLabel.append('Tempo (BPM)', tempoBpm);
clearTuneButton.before(tempoLabel);
const composerStatus = document.querySelector('#composer-status');
const recordingIndicator = document.querySelector('#recording-indicator');
const timeSignature = document.querySelector('#time-signature');
const keySelect = document.querySelector('#key-select');
const scoreTimeLabel = document.querySelector('#score-time-label');
const scoreKeyLabel = document.querySelector('#score-key-label');
const keySignature = document.querySelector('#key-signature');
const scoreCard = document.querySelector('.score-card');
const MUSIC_TUNE_KEY = 'luma-node-tune';
const NOTE_LENGTHS = {
  eighth: 'Eighth',
  sixteenth: '16th',
  'dotted-quarter': 'Dotted quarter',
  'dotted-half': 'Dotted half',
  quarter: 'Quarter',
  half: 'Half',
  whole: 'Whole',
  triplet: 'Triplet',
};
const KEY_SIGNATURES = { C: '', Am: '', G: '♯', D: '♯♯', A: '♯♯♯', E: '♯♯♯♯', F: '♭', Bb: '♭♭', Eb: '♭♭♭' };
const KEY_SIGNATURE_STEPS = { C: [], Am: [], G: [0], D: [0, 3], A: [0, 3, 6], E: [0, 3, 6, 2], F: [4], Bb: [4, 8], Eb: [4, 8, 5] };
const PIANO_PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_PITCHES = new Set(['C#', 'D#', 'F#', 'G#', 'A#']);
const WHITE_KEY_COUNT = 15;
function makePianoNotes(startOctave) {
  const notes = [];
  let whiteIndex = 0;
  for (let octave = startOctave; octave <= startOctave + 2; octave += 1) {
    for (const pitch of PIANO_PITCHES) {
      if (octave === startOctave + 2 && pitch !== 'C') break;
      const isBlack = BLACK_PITCHES.has(pitch);
      notes.push({
        note: pitch + octave,
        label: pitch.replace('#', '♯') + octave,
        type: isBlack ? 'black' : 'white',
        ...(isBlack ? { left: ((whiteIndex - 0.45) * (100 / WHITE_KEY_COUNT)) + '%' } : {}),
      });
      if (!isBlack) whiteIndex += 1;
    }
  }
  return notes;
}
let PIANO_NOTES = makePianoNotes(3);
const DIATONIC_INDEX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const NOTE_STEPS = {};
for (let octave = 1; octave <= 8; octave += 1) {
  for (const pitch of PIANO_PITCHES) {
    NOTE_STEPS[pitch + octave] = (4 - octave) * 7 + (10 - DIATONIC_INDEX[pitch.replace('#', '')]) - (pitch.includes('#') ? 0.5 : 0);
  }
}
const BASS_NOTE_STEPS = {};
for (let octave = 1; octave <= 5; octave += 1) {
  for (const pitch of PIANO_PITCHES) {
    if (octave === 5 && pitch !== 'C') break;
    BASS_NOTE_STEPS[pitch + octave] = (3 - octave) * 7 + (5 - DIATONIC_INDEX[pitch.replace('#', '')]) - (pitch.includes('#') ? 0.5 : 0);
  }
}
const PIANO_KEY_SHORTCUTS = ['q', '2', 'w', '3', 'e', 'r', '5', 't', '6', 'y', '7', 'u', 'z', 's', 'x', 'd', 'c', 'v', 'g', 'b', 'h', 'n', 'j', 'm', ','];
let NOTE_KEY_SHORTCUTS = Object.fromEntries(PIANO_NOTES.map((item, index) => [PIANO_KEY_SHORTCUTS[index], item.note]));
const KEYBOARD_RANGES = [
  { startOctave: 1, label: 'C1–C3' },
  { startOctave: 3, label: 'C3–C5' },
  { startOctave: 5, label: 'C5–C7' },
  { startOctave: 6, label: 'C6–C8' },
];
let keyboardRangeIndex = 1;
let clefType = 'treble';
let tune = [];
let isRecording = false;
let selectedNoteIndex = null;
let hoveredNoteIndex = null;
let undoStack = [];
let redoStack = [];
scoreCard.hidden = true;
let editingSavedTuneId = null;
const SAVED_TUNES_KEY = 'luma-node-saved-tunes';
const savedTunesSection = document.createElement('section');
savedTunesSection.className = 'saved-tunes-section';
savedTunesSection.innerHTML = '<div class="section-heading"><div><p class="kicker">Your library</p><h2>Saved tunes</h2></div></div><div class="saved-tune-list" id="saved-tune-list"></div>';
document.querySelector('.music-section').append(savedTunesSection);
const savedTuneList = savedTunesSection.querySelector('#saved-tune-list');

function readSavedTunes() {
  try {
    const tunes = JSON.parse(localStorage.getItem(SAVED_TUNES_KEY) || '[]');
    return Array.isArray(tunes) ? tunes : [];
  } catch {
    return [];
  }
}

function writeSavedTunes(tunes) {
  localStorage.setItem(SAVED_TUNES_KEY, JSON.stringify(tunes));
}

function tuneKeyLabel(value) {
  return keySelect.options[[...keySelect.options].findIndex(option => option.value === value)]?.textContent || value;
}

function getTempo() {
  const value = Number(tempoBpm.value);
  return Math.max(40, Math.min(240, Number.isFinite(value) ? Math.round(value) : 120));
}

function setTempo(value) {
  tempoBpm.value = String(Math.max(40, Math.min(240, Number(value) || 120)));
}

function renderSavedTunes() {
  const tunes = readSavedTunes();
  savedTuneList.replaceChildren();
  if (!tunes.length) {
    const empty = document.createElement('p');
    empty.className = 'saved-tunes-empty';
    empty.textContent = 'Saved tunes will stay here after you name them.';
    savedTuneList.append(empty);
    return;
  }
  tunes.forEach(saved => {
    const row = document.createElement('article');
    row.className = 'saved-tune-row';
    row.dataset.id = saved.id;
    const info = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = saved.name;
    const details = document.createElement('small');
    details.textContent = tuneKeyLabel(saved.key) + ' · ' + saved.timeSignature.replace('/', ' / ') + ' · ' + saved.notes.length + ' notes';
    info.append(title, details);
    const controls = document.createElement('div');
    controls.className = 'saved-tune-actions';
    ['edit', 'rename', 'play', 'delete'].forEach(action => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.savedAction = action;
      button.dataset.id = saved.id;
      button.textContent = action[0].toUpperCase() + action.slice(1);
      controls.append(button);
    });
    row.append(info, controls);
    savedTuneList.append(row);
  });
}

function snapshotTune() {
  return {
    notes: tune.map(item => ({ ...item })),
    timeSignature: timeSignature.value,
    key: keySelect.value,
    tempo: getTempo(),
  };
}

function recordTuneChange() {
  if (!isRecording) return;
  undoStack.push(snapshotTune());
  redoStack = [];
}

function restoreTune(snapshot) {
  tune = snapshot.notes.map(item => ({ ...item }));
  timeSignature.value = snapshot.timeSignature;
  keySelect.value = snapshot.key;
  setTempo(snapshot.tempo);
  selectedNoteIndex = null;
  hoveredNoteIndex = null;
  noteLengthMenu.hidden = true;
  renderNotation();
}

function createNoteFlag(isSixteenth, isSecond = false) {
  const flag = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  flag.classList.add('note-flag-svg');
  if (isSecond) flag.classList.add('second');
  flag.setAttribute('viewBox', '0 0 18 14');
  flag.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M 1 1 C 5 1, 10 2, 13 5 C 16 8, 16 11, 16 13');
  flag.append(path);
  return flag;
}

function buildPiano() {
  piano.replaceChildren();
  PIANO_NOTES.filter(item => item.type === 'white').forEach(item => {
    const key = document.createElement('button');
    key.className = 'piano-key white';
    key.type = 'button';
    key.dataset.note = item.note;
    key.innerHTML = '<span>' + item.label + '</span>';
    key.addEventListener('click', () => addTuneNote(item.note, key));
    piano.append(key);
  });
  PIANO_NOTES.filter(item => item.type === 'black').forEach(item => {
    const key = document.createElement('button');
    key.className = 'piano-key black';
    key.type = 'button';
    key.style.left = item.left;
    key.dataset.note = item.note;
    key.innerHTML = '<span>' + item.label + '</span>';
    key.addEventListener('click', () => addTuneNote(item.note, key));
    piano.append(key);
  });
}

function setKeyboardRange(index) {
  keyboardRangeIndex = Math.max(0, Math.min(KEYBOARD_RANGES.length - 1, index));
  const range = KEYBOARD_RANGES[keyboardRangeIndex];
  clefType = range.startOctave === 1 ? 'bass' : 'treble';
  PIANO_NOTES = makePianoNotes(range.startOctave);
  NOTE_KEY_SHORTCUTS = Object.fromEntries(PIANO_NOTES.map((item, index) => [PIANO_KEY_SHORTCUTS[index], item.note]));
  buildPiano();
  piano.setAttribute('aria-label', 'Two octave piano keyboard from ' + range.label.replace('–', ' to '));
  renderNotation();
  showToast('Keyboard labels: ' + range.label);
}

function getNoteStep(note) {
  return clefType === 'bass' ? BASS_NOTE_STEPS[note] : NOTE_STEPS[note];
}

function syncClefToKeyboard() {
  clefType = PIANO_NOTES[0]?.note === 'C1' ? 'bass' : 'treble';
}

function addTuneNote(note, key) {
  if (!isRecording) {
    showToast('Click “Create a tune” first');
    return;
  }
  key.classList.add('pressed');
  setTimeout(() => key.classList.remove('pressed'), 180);
  recordTuneChange();
  tune.push({ note, length: 'quarter' });
  renderNotation();
  composerStatus.textContent = 'Recording your tune';
  recordingIndicator.textContent = tune.length + ' note' + (tune.length === 1 ? '' : 's') + ' recorded';
}

function addRest() {
  if (!isRecording) {
    showToast('Click “Create a tune” first');
    return;
  }
  recordTuneChange();
  tune.push({ note: 'rest', length: 'quarter' });
  renderNotation();
  composerStatus.textContent = 'Recording your tune';
  recordingIndicator.textContent = tune.length + ' item' + (tune.length === 1 ? '' : 's') + ' recorded';
}

function renderNotation() {
  syncClefToKeyboard();
  keySignature.textContent = KEY_SIGNATURES[keySelect.value];
  scoreTimeLabel.textContent = timeSignature.value.replace('/', ' / ');
  scoreKeyLabel.textContent = keySelect.options[keySelect.selectedIndex].textContent;
  playTuneButton.disabled = tune.length === 0;
  const score = document.querySelector('#staff');
  score.replaceChildren();
  const measures = makeMeasures();
  const signature = timeSignature.value.split('/');
  const measureCapacity = signature[1] === '8' ? Number(signature[0]) / 2 : Number(signature[0]);
  const lineCount = Math.max(1, Math.ceil(measures.length / 4));
  const noteSteps = tune.map(item => getNoteStep(item.note)).filter(Number.isFinite);
  const highestNoteStep = noteSteps.length ? Math.min(...noteSteps) : 0;
  const lowestNoteStep = noteSteps.length ? Math.max(...noteSteps) : 8;
  const topSpace = Math.max(0, Math.ceil(-highestNoteStep * 5 + 24));
  const bottomSpace = Math.max(0, Math.ceil((lowestNoteStep - 8) * 5 + 24));
  score.style.setProperty('--score-top-space', topSpace + 'px');
  score.style.setProperty('--score-bottom-space', bottomSpace + 'px');
  for (let lineStart = 0; lineStart < lineCount * 4; lineStart += 4) {
    const system = document.createElement('div');
    system.className = 'score-system';
    const systemClef = document.createElement('div');
    systemClef.className = 'system-clef';
    const signatureCount = KEY_SIGNATURES[keySelect.value].length;
    const timeMarkingLeft = 51 + signatureCount * 10;
    const clefBlockWidth = timeMarkingLeft + 28;
    systemClef.style.flexBasis = clefBlockWidth + 'px';
    systemClef.style.width = clefBlockWidth + 'px';
    const clef = document.createElement('span');
    clef.className = clefType === 'bass' ? 'treble-clef bass-clef' : 'treble-clef';
    clef.setAttribute('aria-hidden', 'true');
    clef.textContent = clefType === 'bass' ? '𝄢' : '𝄞';
    systemClef.append(clef, createKeySignature(keySelect.value), createTimeMarking(timeSignature.value, timeMarkingLeft));
    system.append(systemClef);
    const measureRow = document.createElement('div');
    measureRow.className = 'score-measures';
    const beamTargets = [];
    const lineMeasures = measures.slice(lineStart, lineStart + 4);
    while (lineMeasures.length < 4) lineMeasures.push({ entries: [], capacity: measureCapacity });
    lineMeasures.forEach(measureData => {
      const measure = document.createElement('div');
      measure.className = 'score-measure';
      const lines = document.createElement('div');
      lines.className = 'measure-lines';
      measure.append(lines);
      measureData.entries.forEach((entry, localIndex) => {
        const item = entry.item;
        const note = document.createElement('button');
        const isRest = item.note === 'rest';
        const noteStep = isRest ? 5 : getNoteStep(item.note);
        note.type = 'button';
        note.className = (isRest ? 'notation-rest' : 'notation-note') + ' length-' + item.length;
        note.dataset.index = entry.index;
        note.style.left = (7 + (entry.start / measureData.capacity) * 84) + '%';
        note.style.top = (isRest ? 72 : 55 + noteStep * 5) + 'px';
        note.title = (isRest ? 'Rest' : item.note) + ' · ' + NOTE_LENGTHS[item.length];
        note.innerHTML = isRest ? '𝄽' : '';
        if (!isRest && (item.length === 'eighth' || item.length === 'sixteenth')) {
          note.append(createNoteFlag(item.length === 'sixteenth'));
          if (item.length === 'sixteenth') {
            note.append(createNoteFlag(true, true));
          }
        }
        note.addEventListener('mouseenter', () => { hoveredNoteIndex = entry.index; });
        note.addEventListener('mouseleave', () => { if (selectedNoteIndex !== entry.index) hoveredNoteIndex = null; });
        if (!isRest && noteStep >= 10) {
          for (let ledgerStep = 10; ledgerStep <= noteStep; ledgerStep += 2) {
            const ledger = document.createElement('span');
            ledger.className = 'ledger';
            ledger.style.left = 'calc(' + (7 + (entry.start / measureData.capacity) * 84) + '% - 4px)';
            ledger.style.top = (55 + ledgerStep * 5) + 'px';
            ledger.style.width = '26px';
            measure.append(ledger);
          }
        }
        if (!isRest && noteStep < 0) {
          for (let ledgerStep = -2; ledgerStep >= noteStep; ledgerStep -= 2) {
            const ledger = document.createElement('span');
            ledger.className = 'ledger';
            ledger.style.left = 'calc(' + (7 + (entry.start / measureData.capacity) * 84) + '% - 4px)';
            ledger.style.top = (55 + ledgerStep * 5) + 'px';
            ledger.style.width = '26px';
            measure.append(ledger);
          }
        }
        note.addEventListener('click', event => {
          event.stopPropagation();
          selectedNoteIndex = entry.index;
          document.querySelectorAll('.notation-note, .notation-rest').forEach(item => item.classList.remove('selected'));
          note.classList.add('selected');
          noteLengthMenu.hidden = false;
        });
        measure.append(note);
      });
      beamTargets.push({ measure, measureData });
      measureRow.append(measure);
    });
    system.append(measureRow);
    score.append(system);
    beamTargets.forEach(target => addMeasureBeams(target.measure, target.measureData));
  }
}

function createKeySignature(key) {
  const signature = document.createElement('span');
  signature.className = 'system-key-signature';
  const symbols = [...KEY_SIGNATURES[key]];
  (KEY_SIGNATURE_STEPS[key] || []).forEach((step, index) => {
    const accidental = document.createElement('span');
    accidental.className = 'signature-symbol';
    accidental.textContent = symbols[index] || '';
    accidental.style.top = (55 + step * 5 - 9) + 'px';
    accidental.style.left = (index * 10) + 'px';
    signature.append(accidental);
  });
  return signature;
}

function createTimeMarking(value, left) {
  const marking = document.createElement('span');
  const parts = value.split('/');
  marking.className = 'system-time-signature';
  marking.style.left = left + 'px';
  marking.innerHTML = '<span>' + parts[0] + '</span><span>' + parts[1] + '</span>';
  return marking;
}

function noteDuration(length) {
  return { sixteenth: 0.25, eighth: 0.5, quarter: 1, 'dotted-quarter': 1.5, triplet: 1 / 3, half: 2, 'dotted-half': 3, whole: 4 }[length] || 1;
}

function makeMeasures() {
  const signature = timeSignature.value.split('/');
  const capacity = signature[1] === '8' ? Number(signature[0]) / 2 : Number(signature[0]);
  const measures = [];
  let entries = [];
  let used = 0;
  tune.forEach((item, index) => {
    const duration = noteDuration(item.length);
    if (entries.length && used + duration > capacity) {
      measures.push({ entries, capacity });
      entries = [];
      used = 0;
    }
    entries.push({ item, index, start: used });
    used += duration;
    if (used >= capacity) {
      measures.push({ entries, capacity });
      entries = [];
      used = 0;
    }
  });
  if (entries.length) measures.push({ entries, capacity });
  return measures;
}

function addMeasureBeams(measure, measureData) {
  for (let start = 0; start < measureData.entries.length;) {
    const length = measureData.entries[start].item.length;
    if (measureData.entries[start].item.note === 'rest' || (length !== 'eighth' && length !== 'sixteenth')) {
      start += 1;
      continue;
    }
    let runEnd = start + 1;
    while (runEnd < measureData.entries.length && measureData.entries[runEnd].item.length === length) runEnd += 1;
    let groupSize = Math.min(4, runEnd - start);
    if (groupSize === 3) groupSize = 2;
    const end = start + groupSize;
    if (end - start >= 2) {
      const first = measureData.entries[start];
      const last = measureData.entries[end - 1];
      const firstNote = measure.querySelector('[data-index="' + first.index + '"]');
      const lastNote = measure.querySelector('[data-index="' + last.index + '"]');
      const x1 = firstNote.offsetLeft + firstNote.offsetWidth + 2;
      const x2 = lastNote.offsetLeft + lastNote.offsetWidth + 2;
      const y1 = 55 + getNoteStep(first.item.note) * 5 - 28;
      const y2 = 55 + getNoteStep(last.item.note) * 5 - 28;
      const beam = document.createElement('span');
      const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      beam.className = 'notation-beam' + (length === 'sixteenth' ? ' double' : '');
      beam.style.left = x1 + 'px';
      beam.style.width = (x2 - x1) + 'px';
      beam.style.top = y1 + 'px';
      beam.style.transform = 'rotate(' + angle + 'deg)';
      beam.style.transformOrigin = 'left center';
      measure.append(beam);
      for (let index = start; index < end; index += 1) {
        const entry = measureData.entries[index];
        measure.querySelector('[data-index="' + entry.index + '"]').classList.add('beamed');
      }
    }
    start = end;
  }
}

function clearTune() {
  tune = [];
  editingSavedTuneId = null;
  selectedNoteIndex = null;
  hoveredNoteIndex = null;
  isRecording = false;
  clefType = 'treble';
  scoreCard.hidden = true;
  createTuneButton.textContent = '＋ Create a tune';
  composerStatus.textContent = 'Ready when you are';
  recordingIndicator.textContent = 'Start a tune to play';
  noteLengthMenu.hidden = true;
  renderNotation();
}

buildPiano();
document.querySelector('.keyboard-help').textContent = 'Click a key or use Q, 2, W, 3… to enter notes. Shift+W goes higher and Shift+S goes lower while recording.';
renderNotation();
createTuneButton.addEventListener('click', () => {
  tune = [];
  undoStack = [];
  redoStack = [];
  editingSavedTuneId = null;
  selectedNoteIndex = null;
  hoveredNoteIndex = null;
  isRecording = true;
  setKeyboardRange(1);
  scoreCard.hidden = false;
  createTuneButton.textContent = '● Recording tune';
  composerStatus.textContent = 'Choose notes on the keyboard';
  recordingIndicator.textContent = 'Click keys to add notes';
  noteLengthMenu.hidden = true;
  renderNotation();
});
clearTuneButton.addEventListener('click', clearTune);
timeSignature.addEventListener('change', () => {
  if (isRecording) recordTuneChange();
  renderNotation();
});
keySelect.addEventListener('change', () => {
  if (isRecording) recordTuneChange();
  renderNotation();
});
tempoBpm.addEventListener('change', () => {
  if (isRecording) recordTuneChange();
  setTempo(getTempo());
});
noteLengthMenu.addEventListener('click', event => {
  const length = event.target.closest('[data-length]')?.dataset.length;
  if (!length || selectedNoteIndex === null || !tune[selectedNoteIndex]) return;
  recordTuneChange();
  tune[selectedNoteIndex].length = length;
  noteLengthMenu.hidden = true;
  renderNotation();
});
saveTuneButton.addEventListener('click', () => {
  if (!tune.length) {
    showToast('Add at least one note first');
    return;
  }
  const tunes = readSavedTunes();
  const existing = editingSavedTuneId ? tunes.find(saved => saved.id === editingSavedTuneId) : null;
  const name = existing?.name || window.prompt('Name this tune', 'My tune');
  if (!name?.trim()) return;
  const saved = {
    id: existing?.id || String(Date.now()),
    name: name.trim(),
    notes: tune.map(item => ({ ...item })),
    timeSignature: timeSignature.value,
    key: keySelect.value,
    tempo: getTempo(),
  };
  const nextTunes = existing ? tunes.map(item => item.id === saved.id ? saved : item) : [...tunes, saved];
  editingSavedTuneId = saved.id;
  writeSavedTunes(nextTunes);
  renderSavedTunes();
  isRecording = false;
  editingSavedTuneId = null;
  selectedNoteIndex = null;
  hoveredNoteIndex = null;
  noteLengthMenu.hidden = true;
  scoreCard.hidden = true;
  createTuneButton.textContent = '＋ Create a tune';
  composerStatus.textContent = 'Tune saved on this device';
  recordingIndicator.textContent = 'Start a tune to play';
  showToast('Tune saved');
});
async function playTuneData(data) {
  if (!data?.notes?.length) return;
  if (!esp32Connected) {
    showToast('Connect to your ESP32 first');
    return;
  }
  try {
    const response = await fetch(esp32BaseUrl + '/api/tune', {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: data.notes, timeSignature: data.timeSignature, key: data.key, tempo: data.tempo || 120 }),
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    showToast('Tune sent to ESP32');
  } catch {
    showToast('ESP32 could not play this tune');
  }
}
playTuneButton.addEventListener('click', () => playTuneData({ notes: tune, timeSignature: timeSignature.value, key: keySelect.value, tempo: getTempo() }));
savedTuneList.addEventListener('click', event => {
  const button = event.target.closest('[data-saved-action]');
  if (!button) return;
  const tunes = readSavedTunes();
  const saved = tunes.find(item => item.id === button.dataset.id);
  if (!saved) return;
  if (button.dataset.savedAction === 'play') {
    playTuneData(saved);
    return;
  }
  if (button.dataset.savedAction === 'delete') {
    if (!window.confirm('Delete the ' + saved.name + ' tune?')) return;
    writeSavedTunes(tunes.filter(item => item.id !== saved.id));
    if (editingSavedTuneId === saved.id) editingSavedTuneId = null;
    renderSavedTunes();
    showToast('Tune deleted');
    return;
  }
  if (button.dataset.savedAction === 'rename') {
    const renamed = window.prompt('Rename tune', saved.name);
    if (renamed?.trim()) {
      saved.name = renamed.trim();
      writeSavedTunes(tunes);
      renderSavedTunes();
      showToast('Tune renamed');
    }
    return;
  }
  if (button.dataset.savedAction !== 'edit') return;
  tune = saved.notes.map(item => ({ ...item }));
  undoStack = [];
  redoStack = [];
  timeSignature.value = saved.timeSignature;
  keySelect.value = saved.key;
  setTempo(saved.tempo);
  editingSavedTuneId = saved.id;
  isRecording = true;
  syncClefToKeyboard();
  scoreCard.hidden = false;
  createTuneButton.textContent = '● Recording tune';
  composerStatus.textContent = 'Editing ' + saved.name;
  recordingIndicator.textContent = 'Click keys to add notes';
  renderNotation();
  renderSavedTunes();
  scoreCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('Tune loaded for editing');
});
document.addEventListener('click', event => {
  if (!noteLengthMenu.hidden && !noteLengthMenu.contains(event.target) && !event.target.closest('.notation-note')) {
    noteLengthMenu.hidden = true;
  }
});
document.addEventListener('keydown', event => {
  if (!isRecording) return;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    if (event.shiftKey) {
      if (!redoStack.length) return;
      const next = redoStack.pop();
      undoStack.push(snapshotTune());
      restoreTune(next);
      showToast('Redo');
    } else {
      if (!undoStack.length) return;
      const previous = undoStack.pop();
      redoStack.push(snapshotTune());
      restoreTune(previous);
      showToast('Undo');
    }
    return;
  }
  if (event.shiftKey && (event.key.toLowerCase() === 's' || event.key.toLowerCase() === 'w')) {
    event.preventDefault();
    setKeyboardRange(keyboardRangeIndex + (event.key.toLowerCase() === 'w' ? 1 : -1));
    return;
  }
  const index = hoveredNoteIndex ?? selectedNoteIndex;
  const rhythmShortcuts = { '1': 'quarter', '2': 'half', '3': 'dotted-half', '4': 'whole', '5': 'dotted-quarter', '7': 'sixteenth', '8': 'eighth' };
  if (event.key === '-' && !event.repeat) {
    event.preventDefault();
    addRest();
    return;
  }
  const keyboardNote = NOTE_KEY_SHORTCUTS[event.key.toLowerCase()];
  if (keyboardNote && (!rhythmShortcuts[event.key] || index === null) && !event.repeat) {
    event.preventDefault();
    const pianoKey = piano.querySelector('[data-note="' + keyboardNote + '"]');
    addTuneNote(keyboardNote, pianoKey);
    return;
  }
  if (index === null || !tune[index]) return;
  if (rhythmShortcuts[event.key]) {
    event.preventDefault();
    recordTuneChange();
    tune[index].length = rhythmShortcuts[event.key];
    noteLengthMenu.hidden = true;
    renderNotation();
    showToast(NOTE_LENGTHS[tune[index].length] + ' note');
    return;
  }
  if (event.key !== 'Delete' && event.key !== 'Backspace') return;
  event.preventDefault();
  recordTuneChange();
  tune.splice(index, 1);
  selectedNoteIndex = null;
  hoveredNoteIndex = null;
  noteLengthMenu.hidden = true;
  renderNotation();
  recordingIndicator.textContent = tune.length ? tune.length + ' note' + (tune.length === 1 ? '' : 's') + ' recorded' : 'Click keys to add notes';
  composerStatus.textContent = tune.length ? 'Recording your tune' : 'Choose notes on the keyboard';
  showToast('Note deleted');
});
renderSavedTunes();
