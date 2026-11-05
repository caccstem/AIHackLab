const studyToggle = document.getElementById('study-toggle');
const musicButton = document.getElementById('music-button');
const musicPanel = document.getElementById('music-panel');
const notebookButton = document.getElementById('notebook-button');
const notebookPanel = document.getElementById('notebook-panel');
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
let notes = [];

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
  const panels = [musicPanel, notebookPanel];
  const nextPanel = panelName === 'music' ? musicPanel : notebookPanel;
  const nextButton = panelName === 'music' ? musicButton : notebookButton;
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
