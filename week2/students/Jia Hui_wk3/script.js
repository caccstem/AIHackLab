const characterScreen = document.getElementById('characterScreen');
const gameShell = document.getElementById('gameShell');
const playerNameInput = document.getElementById('playerName');
const colorSelect = document.getElementById('playerColor');
const roleRadios = document.querySelectorAll('input[name="role"]');
const startGameBtn = document.getElementById('startGameBtn');
const avatarPreview = document.getElementById('avatarPreview');
const previewName = document.getElementById('previewName');
const previewRole = document.getElementById('previewRole');
const playerIdentity = document.getElementById('playerIdentity');
const roomBadge = document.getElementById('roomBadge');

const sceneText = document.getElementById('sceneText');
const evidenceList = document.getElementById('evidenceList');
const inventoryList = document.getElementById('inventoryList');
const submitCode = document.getElementById('submitCode');
const codeInput = document.getElementById('codeInput');
const doorMessage = document.getElementById('doorMessage');
const lockStatus = document.getElementById('lockStatus');
const timerEl = document.getElementById('timer');

const clues = {
  board: {
    text: 'A rusted evidence board sways in the dark. Photos of four suspects circle a victim report. One note reads: “The killer did not need to stay in the room. The answer is hidden in the order of the disappeared pages.”',
    reward: 'A suspect list with the initials: M, I, D, A.'
  },
  desk: {
    text: 'The desk is covered in blood, ink, and torn ledger paper. One page is still intact: “7 • 3 • 1 • 8”. A second line beneath it says, “The code is the missing pages, not the time.”',
    reward: 'Ledger page: 7, 3, 1, 8.'
  },
  lamp: {
    text: 'The power-lamp sputters to life for half a second. Beneath it, a brass key is tucked into the floor joint, still warm as if someone dropped it in a panic.',
    reward: 'Brass key.'
  },
  cabinet: {
    text: 'The hidden cabinet clicks open with the brass key. Inside sits a confession fragment: “Because the clock was broken, the witness wrote the numbers backwards.”',
    reward: 'Cipher note: reverse the sequence from the ledger.'
  },
  door: {
    text: 'The heavy steel door bears a keypad and a scratched note: “Only the true sequence opens the final lock.” The room is sealed shut from every angle. There is no window. No vent. No escape path but the keypad.'
  }
};

const state = {
  discovered: new Set(),
  inventory: [],
  timeLeft: 360,
  gameOver: false,
  solved: false,
  currentRoom: 1,
  currentAnswer: '8137',
  clueDigits: [7, 3, 1, 8]
};

function makeRandomSequence() {
  const digits = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9) + 1);
  const answer = digits.slice().reverse().join('');
  return { digits, answer };
}

function resetForNextRoom() {
  const roomNumber = state.currentRoom;
  const sequence = makeRandomSequence();
  state.currentAnswer = sequence.answer;
  state.clueDigits = sequence.digits;
  state.discovered = new Set();
  state.inventory = [];
  state.timeLeft = 360;
  state.gameOver = false;
  state.solved = false;
  codeInput.disabled = false;
  submitCode.disabled = false;
  lockStatus.textContent = 'SEALED';
  lockStatus.style.color = '#ff4757';
  roomBadge.textContent = `ROOM ${roomNumber}`;
  doorMessage.textContent = 'The archive breathes around you. A new door waits.';
  codeInput.value = '';
  renderEvidence();
  renderInventory();
  updateTimer();

  const clueSequence = state.clueDigits.join(' • ');
  clues.board.text = `Room ${roomNumber}: A rusted evidence board trembles. The notes form a new pattern: ${clueSequence}. Someone scratched beneath it: “The code is hidden in the order of the disappeared pages.”`;
  clues.desk.text = `Room ${roomNumber}: The desk is still slick with ink. A ledger page reads “${clueSequence}” and below it: “The coded answer is written backwards in the archive.”`;
  clues.cabinet.text = `Room ${roomNumber}: The cabinet opens with a cold click. Inside is a confession: “The witness wrote the numbers backwards before the room forgot them.”`;
  clues.door.text = `Room ${roomNumber}: The final door waits under a dead blue glow. The room has no way out except the correct sequence.`;
  sceneText.textContent = `Room ${roomNumber}: The walls hum with old fear. Every corridor repeats the same lesson: the archive wants the truth, and the truth is never in the right order.`;
}

function applyCharacterCustomization() {
  const name = playerNameInput.value.trim() || 'Agent Unknown';
  const selectedRole = document.querySelector('input[name="role"]:checked')?.value || 'Detective';
  const accentMap = {
    amber: ['#ffc857', '#ff9247'],
    crimson: ['#ff6b6b', '#d72638'],
    teal: ['#7ef2d9', '#29b6a6'],
    violet: ['#b995ff', '#7e5ae6']
  };
  const [startColor, endColor] = accentMap[colorSelect.value] || accentMap.amber;

  previewName.textContent = name;
  previewRole.textContent = selectedRole;
  avatarPreview.textContent = name.charAt(0).toUpperCase() || 'A';
  avatarPreview.style.background = `linear-gradient(180deg, ${startColor}, ${endColor})`;
  playerIdentity.textContent = `Investigator: ${name} // ${selectedRole}`;

  document.documentElement.style.setProperty('--amber', startColor);
  document.documentElement.style.setProperty('--danger', endColor);
}

roleRadios.forEach((radio) => radio.addEventListener('change', applyCharacterCustomization));
playerNameInput.addEventListener('input', applyCharacterCustomization);
colorSelect.addEventListener('change', applyCharacterCustomization);

startGameBtn.addEventListener('click', () => {
  applyCharacterCustomization();
  characterScreen.style.display = 'none';
  gameShell.classList.remove('hidden');
});

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateTimer() {
  timerEl.textContent = formatTime(state.timeLeft);
}

function tickTimer() {
  if (state.gameOver || state.solved) return;

  state.timeLeft -= 1;
  updateTimer();

  if (state.timeLeft <= 0) {
    state.gameOver = true;
    lockStatus.textContent = 'TRAPPED';
    lockStatus.style.color = '#ff4757';
    doorMessage.textContent = 'The lights die. The walls hum. The room locks itself forever. The final siren echoes in the dark. You are trapped in the archive with no way out.';
    sceneText.textContent = 'The room closes in. The shadows move. The cold turns to the feeling of a hand on the back of your neck. The archive remembers every victim it never released.';
    codeInput.disabled = true;
    submitCode.disabled = true;
  }
}

function renderEvidence() {
  evidenceList.innerHTML = '';

  if (state.discovered.size === 0) {
    const li = document.createElement('li');
    li.textContent = 'Initial report: missing.';
    evidenceList.appendChild(li);
    return;
  }

  [...state.discovered].forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    evidenceList.appendChild(li);
  });
}

function renderInventory() {
  inventoryList.innerHTML = '';

  if (state.inventory.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Empty hands';
    inventoryList.appendChild(li);
    return;
  }

  state.inventory.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    inventoryList.appendChild(li);
  });
}

function addEvidence(text) {
  if (!state.discovered.has(text)) {
    state.discovered.add(text);
    renderEvidence();
  }
}

function inspectScene(scene) {
  if (state.gameOver || state.solved) return;

  const data = clues[scene];
  sceneText.textContent = data.text;

  if (scene === 'board') {
    addEvidence(`Suspect pattern: ${state.clueDigits.join(' • ')}`);
  }

  if (scene === 'desk') {
    addEvidence(`Ledger page: ${state.clueDigits.join(' • ')}`);
  }

  if (scene === 'lamp') {
    if (!state.inventory.includes('Brass key')) {
      state.inventory.push('Brass key');
      renderInventory();
    }
    addEvidence('Key found beneath the lamp.');
  }

  if (scene === 'cabinet') {
    if (state.inventory.includes('Brass key')) {
      addEvidence('Cipher note: reverse the sequence from the ledger.');
      sceneText.textContent = `Room ${state.currentRoom}: A confession fragment falls from the cabinet: “Because the clock was broken, the witness wrote the numbers backwards.” The pattern is hidden in reverse, and the archive will only open if you trust the wrong order.`;
    } else {
      sceneText.textContent = 'The cabinet is locked tight. A brass key is somewhere nearby, hidden in the dark. You are still trapped in the room.';
    }
  }

  if (scene === 'door') {
    sceneText.textContent = `Room ${state.currentRoom}: The final door waits under a dead blue glow. Its keypad watches you with a patient, hungry stare. The archive has no mercy, only another code.`;
  }
}

const roomButtons = document.querySelectorAll('.scene-item');
roomButtons.forEach((button) => {
  button.addEventListener('click', () => {
    inspectScene(button.dataset.scene);
  });
});

submitCode.addEventListener('click', () => {
  if (state.gameOver || state.solved) return;

  const answer = codeInput.value.trim();

  if (!state.discovered.has(`Ledger page: ${state.clueDigits.join(' • ')}`) || !state.discovered.has('Cipher note: reverse the sequence from the ledger.')) {
    doorMessage.textContent = 'The keypad blinks red. The room is sealed and the clues are still missing.';
    return;
  }

  if (answer === state.currentAnswer) {
    state.solved = true;
    lockStatus.textContent = 'OPEN';
    lockStatus.style.color = '#7ef2d9';
    doorMessage.textContent = `Room ${state.currentRoom} unlocked. The archive exhales, and the next chamber opens behind you.`;
    sceneText.textContent = `The door groans open. Beyond it, another corridor waits under a colder glow, and the walls seem to whisper: “Room ${state.currentRoom + 1} is already hungry.”`;
    codeInput.value = '';

    state.currentRoom += 1;
    setTimeout(() => {
      resetForNextRoom();
    }, 1600);
  } else {
    doorMessage.textContent = 'The lock snaps shut with a hiss. The steel walls close in. You are still trapped. Try again.';
    codeInput.value = '';
  }
});

updateTimer();
setInterval(tickTimer, 1000);
resetForNextRoom();

resetForNextRoom();
renderEvidence();
renderInventory();
