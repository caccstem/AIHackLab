const studyToggle = document.getElementById('study-toggle');
const musicButton = document.getElementById('music-button');
const musicPanel = document.getElementById('music-panel');
const notebookButton = document.getElementById('notebook-button');
const notebookPanel = document.getElementById('notebook-panel');
const scheduleButton = document.getElementById('schedule-button');
const schedulePanel = document.getElementById('schedule-panel');
const scheduleFormToggle = document.getElementById('schedule-form-toggle');
const scheduleForm = document.getElementById('schedule-form');
const scheduleList = document.getElementById('schedule-list');
const scheduleFeedback = document.getElementById('schedule-feedback');
const noteForm = document.getElementById('note-form');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const noteFeedback = document.getElementById('note-feedback');
const notesList = document.getElementById('notes-list');
const noteCount = document.getElementById('note-count');
const notebookViewport = document.getElementById('notebook-viewport');
const notebookPageShell = document.getElementById('notebook-page-shell');
const notebookPage = document.getElementById('notebook-page');
const zoomOutButton = document.getElementById('zoom-out');
const zoomInButton = document.getElementById('zoom-in');
const zoomLevel = document.getElementById('zoom-level');
const fitWidthButton = document.getElementById('fit-width');
const fitHeightButton = document.getElementById('fit-height');
const soundStatus = document.getElementById('sound-status');
const musicInputs = document.querySelectorAll('input[name="music"]');
const ambientInputs = document.querySelectorAll('input[name="ambient"]');

const state = {
  isStudying: false,
  musicMode: 'lofi',
  ambient: new Set(['rain'])
};

const NOTES_KEY = 'study-space-notes-v1';
const SCHEDULE_KEY = 'study-space-schedule-v1';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
let notes = [];
const NOTEBOOK_PAGE_WIDTH = 680;
const NOTEBOOK_PAGE_HEIGHT = 880;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
let notebookZoom = 1;
let notebookFitMode = null;
let schedule = [
  { id: 'sample-math', name: 'Math', day: 'Monday', time: '09:00', type: 'school' },
  { id: 'sample-science', name: 'Science', day: 'Tuesday', time: '10:30', type: 'school' },
  { id: 'sample-piano', name: 'Piano lesson', day: 'Wednesday', time: '16:00', type: 'outside' },
  { id: 'sample-art', name: 'Art class', day: 'Saturday', time: '11:00', type: 'outside' }
];

try {
  const savedNotes = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
  if (Array.isArray(savedNotes)) notes = savedNotes;
} catch (error) {
  noteFeedback.textContent = 'Could not load saved notes in this browser.';
}

try {
  const savedSchedule = JSON.parse(localStorage.getItem(SCHEDULE_KEY) || 'null');
  if (Array.isArray(savedSchedule)) schedule = savedSchedule;
} catch (error) {
  scheduleFeedback.textContent = 'Could not load your saved schedule.';
}

let audioCtx = null;
let audioNodes = [];

function setStatus(text) {
  soundStatus.textContent = text;
}

function showPanel(panelName) {
  const panelMap = {
    music: [musicPanel, musicButton],
    schedule: [schedulePanel, scheduleButton],
    notebook: [notebookPanel, notebookButton]
  };
  const panels = [musicPanel, schedulePanel, notebookPanel];
  const [nextPanel, nextButton] = panelMap[panelName];
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

function saveSchedule() {
  try {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
    return true;
  } catch (error) {
    scheduleFeedback.textContent = 'Could not save your schedule in this browser.';
    return false;
  }
}

function formatClassTime(time) {
  const [hour, minute] = time.split(':').map(Number);
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
    .format(new Date(2024, 0, 1, hour, minute));
}

function renderSchedule() {
  scheduleList.replaceChildren();
  const ordered = [...schedule].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.time.localeCompare(b.time));
  const populatedDays = DAYS.filter((day) => ordered.some((item) => item.day === day));

  if (!populatedDays.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-schedule';
    empty.textContent = 'Your week is open. Add your first class to get started.';
    scheduleList.append(empty);
    return;
  }

  populatedDays.forEach((day) => {
    const dayGroup = document.createElement('section');
    dayGroup.className = 'schedule-day';
    const heading = document.createElement('h4');
    heading.textContent = day;
    dayGroup.append(heading);

    ordered.filter((item) => item.day === day).forEach((item) => {
      const row = document.createElement('article');
      row.className = `class-row ${item.type}`;
      const time = document.createElement('time');
      time.textContent = formatClassTime(item.time);
      const details = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = item.name;
      const type = document.createElement('span');
      type.textContent = item.type === 'school' ? 'In school' : 'Outside school';
      details.append(name, type);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'delete-class';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Remove ${item.name} from your schedule`);
      remove.addEventListener('click', () => {
        schedule = schedule.filter((entry) => entry.id !== item.id);
        if (saveSchedule()) renderSchedule();
      });
      row.append(time, details, remove);
      dayGroup.append(row);
    });
    scheduleList.append(dayGroup);
  });
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

function setNotebookZoom(nextZoom, fitMode = null) {
  notebookZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
  notebookFitMode = fitMode;
  notebookPage.style.transform = `scale(${notebookZoom})`;
  notebookPageShell.style.width = `${NOTEBOOK_PAGE_WIDTH * notebookZoom}px`;
  notebookPageShell.style.height = `${Math.max(NOTEBOOK_PAGE_HEIGHT, notebookPage.scrollHeight) * notebookZoom}px`;
  zoomLevel.value = `${Math.round(notebookZoom * 100)}%`;
  zoomLevel.textContent = zoomLevel.value;
  fitWidthButton.classList.toggle('active', fitMode === 'width');
  fitHeightButton.classList.toggle('active', fitMode === 'height');
  fitWidthButton.setAttribute('aria-pressed', String(fitMode === 'width'));
  fitHeightButton.setAttribute('aria-pressed', String(fitMode === 'height'));
}

function fitNotebook(mode) {
  const styles = getComputedStyle(notebookViewport);
  const availableWidth = notebookViewport.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
  const availableHeight = notebookViewport.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
  const scale = mode === 'width'
    ? availableWidth / NOTEBOOK_PAGE_WIDTH
    : availableHeight / NOTEBOOK_PAGE_HEIGHT;
  setNotebookZoom(scale, mode);
  notebookViewport.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
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
scheduleButton.addEventListener('click', () => showPanel('schedule'));
notebookButton.addEventListener('click', () => {
  const opening = notebookPanel.classList.contains('hidden');
  showPanel('notebook');
  if (opening) requestAnimationFrame(() => fitNotebook('width'));
});

zoomOutButton.addEventListener('click', () => setNotebookZoom(notebookZoom - 0.1));
zoomInButton.addEventListener('click', () => setNotebookZoom(notebookZoom + 0.1));
fitWidthButton.addEventListener('click', () => fitNotebook('width'));
fitHeightButton.addEventListener('click', () => fitNotebook('height'));

notebookViewport.addEventListener('wheel', (event) => {
  if (!event.ctrlKey && !event.metaKey) return;
  event.preventDefault();
  setNotebookZoom(notebookZoom + (event.deltaY < 0 ? 0.1 : -0.1));
}, { passive: false });

window.addEventListener('resize', () => {
  if (notebookFitMode) fitNotebook(notebookFitMode);
});

new ResizeObserver(() => {
  notebookPageShell.style.height = `${Math.max(NOTEBOOK_PAGE_HEIGHT, notebookPage.scrollHeight) * notebookZoom}px`;
}).observe(notebookPage);

scheduleFormToggle.addEventListener('click', () => {
  const opening = scheduleForm.classList.contains('hidden');
  scheduleForm.classList.toggle('hidden', !opening);
  scheduleFormToggle.setAttribute('aria-expanded', String(opening));
  scheduleFormToggle.textContent = opening ? 'Close' : '+ Add class';
  if (opening) document.getElementById('class-name').focus();
});

scheduleForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(scheduleForm);
  schedule.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: formData.get('name').trim(),
    day: formData.get('day'),
    time: formData.get('time'),
    type: formData.get('type')
  });
  if (saveSchedule()) {
    renderSchedule();
    scheduleForm.reset();
    scheduleFeedback.textContent = 'Class added to your week.';
  }
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
renderSchedule();
updateAudioState();
setNotebookZoom(1);
