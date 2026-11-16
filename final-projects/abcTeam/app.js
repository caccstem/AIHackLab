const studyToggle = document.getElementById('study-toggle');
const musicButton = document.getElementById('music-button');
const musicPanel = document.getElementById('music-panel');
const notebookButton = document.getElementById('notebook-button');
const notebookPanel = document.getElementById('notebook-panel');
const settingsButton = document.getElementById('settings-button');
const settingsPanel = document.getElementById('settings-panel');
const timeLimitForm = document.getElementById('time-limit-form');
const timeLimitInput = document.getElementById('time-limit-minutes');
const timeLimitEnabled = document.getElementById('time-limit-enabled');
const timerStatus = document.getElementById('timer-status');
const timeLimitReminder = document.getElementById('time-limit-reminder');
const dismissReminder = document.getElementById('dismiss-reminder');
const noteForm = document.getElementById('note-form');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const noteFeedback = document.getElementById('note-feedback');
const notesList = document.getElementById('notes-list');
const noteCount = document.getElementById('note-count');
const soundStatus = document.getElementById('sound-status');
const musicInputs = document.querySelectorAll('input[name="music"]');
const ambientInputs = document.querySelectorAll('input[name="ambient"]');

const state = {
  isStudying: false,
  musicMode: 'lofi',
  ambient: new Set(['rain'])
};

const NOTES_KEY = 'study-space-notes-v1';
const TIME_LIMIT_KEY = 'study-space-time-limit-minutes-v1';
const TIME_LIMIT_ENABLED_KEY = 'study-space-time-limit-enabled-v1';
const DAILY_USAGE_KEY = 'study-space-daily-usage-v1';
let notes = [];
let timerInterval = null;
let dailyUsage = { date: '', usedMs: 0, notified: false };
let lastUsageTick = 0;

try {
  const savedNotes = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
  if (Array.isArray(savedNotes)) notes = savedNotes;
} catch (error) {
  noteFeedback.textContent = 'Could not load saved notes in this browser.';
}

let audioCtx = null;
let audioNodes = [];

function setStatus(text) {
  soundStatus.textContent = text;
}

function showPanel(panelName) {
  const panels = [musicPanel, notebookPanel, settingsPanel];
  const panelMap = { music: musicPanel, notebook: notebookPanel, settings: settingsPanel };
  const buttonMap = { music: musicButton, notebook: notebookButton, settings: settingsButton };
  const nextPanel = panelMap[panelName];
  const nextButton = buttonMap[panelName];
  if (!nextPanel || !nextButton) return;
  const shouldOpen = nextPanel.classList.contains('hidden');

  panels.forEach((panel) => panel.classList.add('hidden'));
  document.querySelectorAll('.space-nav .nav-button').forEach((button) => button.classList.remove('active'));

  if (shouldOpen) {
    nextPanel.classList.remove('hidden');
    nextButton.classList.add('active');
  } else {
    document.querySelector('.space-nav .nav-button').classList.add('active');
  }
}

function saveNotes() {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    return true;
  } catch (error) {
    noteFeedback.textContent = 'Could not save notes. Check browser storage settings.';
    return false;
  }
}

function renderNotes() {
  noteCount.textContent = `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`;
  notesList.replaceChildren();

  if (notes.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-notes';
    empty.textContent = 'Your notebook is ready for its first little idea.';
    notesList.append(empty);
    return;
  }

  notes.forEach((note) => {
    const card = document.createElement('article');
    card.className = 'note-card';

    const title = document.createElement('h5');
    title.textContent = note.title || 'Untitled note';

    const content = document.createElement('p');
    content.textContent = note.content;

    const date = document.createElement('time');
    date.className = 'note-date';
    date.dateTime = note.createdAt;
    date.textContent = new Date(note.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'delete-note';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Delete ${note.title || 'untitled note'}`);
    remove.addEventListener('click', () => {
      notes = notes.filter((entry) => entry.id !== note.id);
      if (saveNotes()) {
        noteFeedback.textContent = 'Note removed.';
        renderNotes();
      }
    });

    card.append(remove, title, content, date);
    notesList.append(card);
  });
}

function localDateKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function saveDailyUsage() {
  try {
    localStorage.setItem(DAILY_USAGE_KEY, JSON.stringify(dailyUsage));
  } catch (error) {
    timerStatus.textContent = 'Could not save today’s time limit in this browser.';
  }
}

function notifyTimeLimitReached() {
  if (dailyUsage.notified) return;
  dailyUsage.notified = true;
  saveDailyUsage();
  timeLimitReminder.classList.remove('hidden');

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Time for a screen break', {
      body: 'You’ve reached your time limit. Step away from screens and take a short break.'
    });
  }
}

function updateDailyUsage() {
  const today = localDateKey();
  if (dailyUsage.date !== today) {
    dailyUsage = { date: today, usedMs: 0, notified: false };
  }

  if (!timeLimitEnabled.checked) return;

  const now = Date.now();
  if (lastUsageTick > 0) {
    dailyUsage.usedMs += Math.max(0, now - lastUsageTick);
  }
  lastUsageTick = document.visibilityState === 'visible' ? now : 0;

  const savedLimit = Number(localStorage.getItem(TIME_LIMIT_KEY));
  const limitMs = savedLimit * 60 * 1000;
  if (Number.isFinite(limitMs) && limitMs > 0) {
    const remainingMs = Math.max(0, limitMs - dailyUsage.usedMs);
    const elapsedMinutes = Math.floor(dailyUsage.usedMs / 60000);
    const elapsedSeconds = Math.floor((dailyUsage.usedMs % 60000) / 1000);
    timerStatus.textContent = remainingMs > 0
      ? `Today: ${elapsedMinutes}m ${String(elapsedSeconds).padStart(2, '0')}s of ${savedLimit}m used.`
      : 'Daily time limit reached. Take a short screen break.';
    if (remainingMs === 0) notifyTimeLimitReached();
  }

  saveDailyUsage();
}

function stopUsageTimer() {
  window.clearInterval(timerInterval);
  timerInterval = null;
  lastUsageTick = 0;
}

function initializeUsageTimer() {
  const savedLimit = Number(localStorage.getItem(TIME_LIMIT_KEY));
  const isEnabled = localStorage.getItem(TIME_LIMIT_ENABLED_KEY) === 'true';
  timeLimitEnabled.checked = isEnabled;
  timeLimitForm.classList.toggle('hidden', !isEnabled);

  try {
    const savedUsage = JSON.parse(localStorage.getItem(DAILY_USAGE_KEY) || 'null');
    if (savedUsage && savedUsage.date === localDateKey()) {
      dailyUsage = {
        date: savedUsage.date,
        usedMs: Number(savedUsage.usedMs) || 0,
        notified: savedUsage.notified === true
      };
    } else {
      dailyUsage = { date: localDateKey(), usedMs: 0, notified: false };
    }
  } catch (error) {
    dailyUsage = { date: localDateKey(), usedMs: 0, notified: false };
  }

  if (Number.isInteger(savedLimit) && savedLimit >= 1 && savedLimit <= 480) {
    timeLimitInput.value = String(savedLimit);
  }

  if (isEnabled && Number.isInteger(savedLimit) && savedLimit >= 1 && savedLimit <= 480) {
    lastUsageTick = document.visibilityState === 'visible' ? Date.now() : 0;
    updateDailyUsage();
    timerInterval = window.setInterval(updateDailyUsage, 1000);
    if (dailyUsage.notified) timeLimitReminder.classList.remove('hidden');
  } else {
    timerStatus.textContent = 'No time limit set yet.';
  }
}

function createAudioContext() {
  if (!audioCtx) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      setStatus('Audio unavailable');
      return null;
    }
    audioCtx = new AudioCtor();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function stopCurrentAudio() {
  for (const node of audioNodes) {
    try {
      node.stop?.();
    } catch (error) {
      // ignore nodes that are already stopped
    }
    try {
      node.disconnect?.();
    } catch (error) {
      // ignore disconnect errors
    }
  }
  audioNodes = [];
}

function makeNoiseBuffer(duration = 2) {
  const length = Math.max(1, Math.floor(audioCtx.sampleRate * duration));
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    channel[i] = (Math.random() * 2 - 1) * 0.7;
  }
  return buffer;
}

function startNoiseLoop({ gainValue = 0.04, filterType = 'lowpass', filterFreq = 900, highpassFreq = 200 }) {
  const ctx = createAudioContext();
  if (!ctx) return;

  const source = ctx.createBufferSource();
  source.buffer = makeNoiseBuffer(2);
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  if (filterType === 'highpass') {
    filter.Q.value = 1.2;
  }

  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = highpassFreq;

  const gainNode = ctx.createGain();
  gainNode.gain.value = gainValue;

  source.connect(filter);
  filter.connect(hpf);
  hpf.connect(gainNode);
  gainNode.connect(ctx.destination);

  source.start();
  audioNodes.push(source, filter, hpf, gainNode);
}

function startLofiLoop() {
  const ctx = createAudioContext();
  if (!ctx) return;

  const oscillators = [
    { type: 'triangle', freq: 220, gain: 0.04 },
    { type: 'sine', freq: 330, gain: 0.025 },
    { type: 'sawtooth', freq: 110, gain: 0.015 }
  ];

  oscillators.forEach(({ type, freq, gain }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.value = freq;

    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.7;

    gainNode.gain.value = gain;

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    audioNodes.push(osc, filter, gainNode);
  });
}

function updateAudioState() {
  stopCurrentAudio();

  if (!state.isStudying) {
    setStatus('Paused');
    return;
  }

  let status = 'No music';

  if (state.musicMode === 'lofi') {
    startLofiLoop();
    status = 'Lofi playing';
  }

  if (state.ambient.has('fireplace')) {
    startNoiseLoop({ gainValue: 0.05, filterType: 'lowpass', filterFreq: 900, highpassFreq: 120 });
    status = status === 'No music' ? 'Fireplace' : `${status} + fireplace`;
  }

  if (state.ambient.has('rain')) {
    startNoiseLoop({ gainValue: 0.04, filterType: 'highpass', filterFreq: 2400, highpassFreq: 600 });
    status = status === 'No music' ? 'Rain' : `${status} + rain`;
  }

  setStatus(status);
}

function setStudyMode(on) {
  state.isStudying = on;
  studyToggle.textContent = on ? 'Stop studying' : 'Start studying';
  studyToggle.classList.toggle('active', on);
  updateAudioState();
}

studyToggle.addEventListener('click', () => {
  setStudyMode(!state.isStudying);
});

musicButton.addEventListener('click', () => showPanel('music'));
notebookButton.addEventListener('click', () => showPanel('notebook'));
settingsButton.addEventListener('click', () => showPanel('settings'));

timeLimitEnabled.addEventListener('change', () => {
  const enabled = timeLimitEnabled.checked;
  timeLimitForm.classList.toggle('hidden', !enabled);
  if (!enabled) {
    localStorage.setItem(TIME_LIMIT_ENABLED_KEY, 'false');
    stopUsageTimer();
    timerStatus.textContent = 'Daily time limit is off.';
  } else {
    timerStatus.textContent = 'Choose a daily limit and confirm to turn it on.';
    timeLimitInput.focus();
  }
});

timeLimitForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const minutes = Number(timeLimitInput.value);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 480) {
    timerStatus.textContent = 'Choose a whole number from 1 to 480 minutes.';
    timeLimitInput.focus();
    return;
  }

  updateDailyUsage();
  localStorage.setItem(TIME_LIMIT_KEY, String(minutes));
  localStorage.setItem(TIME_LIMIT_ENABLED_KEY, 'true');
  timeLimitEnabled.checked = true;
  stopUsageTimer();
  lastUsageTick = document.visibilityState === 'visible' ? Date.now() : 0;
  updateDailyUsage();
  timerInterval = window.setInterval(updateDailyUsage, 1000);

  if ('Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (error) {
      // The in-page reminder remains available when browser notifications are blocked.
    }
  }
});

dismissReminder.addEventListener('click', () => timeLimitReminder.classList.add('hidden'));

document.addEventListener('visibilitychange', () => {
  if (!timeLimitEnabled.checked) return;
  updateDailyUsage();
});

window.addEventListener('pagehide', () => {
  if (timeLimitEnabled.checked) updateDailyUsage();
});

noteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const content = noteContent.value.trim();
  if (!content) {
    noteFeedback.textContent = 'Add a few words before saving your note.';
    noteContent.focus();
    return;
  }

  notes.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: noteTitle.value.trim(),
    content,
    createdAt: new Date().toISOString()
  });

  if (saveNotes()) {
    renderNotes();
    noteForm.reset();
    noteFeedback.textContent = 'Saved — your idea is tucked away.';
    noteTitle.focus();
  }
});

musicInputs.forEach((input) => {
  input.addEventListener('change', (event) => {
    state.musicMode = event.target.value;
    updateAudioState();
  });
});

ambientInputs.forEach((input) => {
  input.addEventListener('change', (event) => {
    const value = event.target.value;
    if (event.target.checked) {
      state.ambient.add(value);
    } else {
      state.ambient.delete(value);
    }
    updateAudioState();
  });
});

musicInputs.forEach((input) => {
  if (input.value === state.musicMode) input.checked = true;
});

ambientInputs.forEach((input) => {
  input.checked = state.ambient.has(input.value);
});

renderNotes();
updateAudioState();
initializeUsageTimer();
