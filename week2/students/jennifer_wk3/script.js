const ROWS = 6;
const COLS = 5;
const KEYS = ["QWERTYUIOP", "ASDFGHJKL", ["ENTER", ..."ZXCVBNM", "⌫"]];
const STORAGE_KEY = "endless-wordle-stats-v1";

let words = [];
let wordSet = new Set();
let answer = "";
let guesses = [];
let current = "";
let gameOver = false;
let locked = false;
let keyStates = {};

const board = document.querySelector("#board");
const keyboard = document.querySelector("#keyboard");
const message = document.querySelector("#message");
const dialog = document.querySelector("#stats-dialog");

function buildBoard() {
  board.innerHTML = "";
  for (let row = 0; row < ROWS; row++) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";
    for (let col = 0; col < COLS; col++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      rowEl.append(tile);
    }
    board.append(rowEl);
  }
}

function buildKeyboard() {
  keyboard.innerHTML = "";
  KEYS.forEach((keyRow) => {
    const row = document.createElement("div");
    row.className = "key-row";
    Array.from(keyRow).forEach((letter) => {
      const key = document.createElement("button");
      key.className = `key ${letter.length > 1 ? "wide" : ""}`;
      key.dataset.key = letter;
      key.textContent = letter;
      key.setAttribute("aria-label", letter === "⌫" ? "Backspace" : letter);
      key.addEventListener("click", () => handleKey(letter));
      row.append(key);
    });
    keyboard.append(row);
  });
}

function renderCurrent() {
  const tiles = board.children[guesses.length]?.children;
  if (!tiles) return;
  for (let i = 0; i < COLS; i++) {
    tiles[i].textContent = current[i] || "";
    tiles[i].classList.toggle("filled", Boolean(current[i]));
  }
}

function scoreGuess(guess) {
  const result = Array(COLS).fill("absent");
  const remaining = answer.split("");
  for (let i = 0; i < COLS; i++) {
    if (guess[i] === answer[i]) { result[i] = "correct"; remaining[i] = null; }
  }
  for (let i = 0; i < COLS; i++) {
    if (result[i] === "correct") continue;
    const match = remaining.indexOf(guess[i]);
    if (match !== -1) { result[i] = "present"; remaining[match] = null; }
  }
  return result;
}

function submitGuess() {
  if (current.length !== COLS) return notify("Not enough letters", true);
  if (!wordSet.has(current)) return notify("Not in the dictionary", true);
  locked = true;
  const guess = current;
  const rowIndex = guesses.length;
  const result = scoreGuess(guess);
  guesses.push(guess);

  [...board.children[rowIndex].children].forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add(result[index], "reveal");
      updateKey(guess[index], result[index]);
    }, index * 160);
  });

  setTimeout(() => {
    current = "";
    locked = false;
    if (guess === answer) finishGame(true);
    else if (guesses.length === ROWS) finishGame(false);
  }, 900);
}

function updateKey(letter, state) {
  const rank = { absent: 1, present: 2, correct: 3 };
  if ((rank[state] || 0) <= (rank[keyStates[letter]] || 0)) return;
  keyStates[letter] = state;
  const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`);
  if (key) { key.classList.remove("absent", "present", "correct"); key.classList.add(state); }
}

function handleKey(rawKey) {
  if (gameOver || locked) return;
  const key = rawKey.toUpperCase();
  if (key === "ENTER") return submitGuess();
  if (key === "⌫" || key === "BACKSPACE" || key === "DELETE") current = current.slice(0, -1);
  else if (/^[A-Z]$/.test(key) && current.length < COLS) current += key.toLowerCase();
  renderCurrent();
}

function finishGame(won) {
  gameOver = true;
  const stats = getStats();
  stats.played += 1;
  if (won) { stats.wins += 1; stats.totalWinTries += guesses.length; }
  else stats.losses += 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  notify(won ? (guesses.length === 1 ? "Genius!" : "You got it!") : `The word was ${answer.toUpperCase()}`);
  setTimeout(openStats, won ? 1100 : 1600);
}

function getStats() {
  try {
    return { played: 0, wins: 0, losses: 0, totalWinTries: 0, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch { return { played: 0, wins: 0, losses: 0, totalWinTries: 0 }; }
}

function openStats() {
  const s = getStats();
  document.querySelector("#played-stat").textContent = s.played;
  document.querySelector("#win-stat").textContent = s.played ? `${Math.round(s.wins / s.played * 100)}%` : "0%";
  document.querySelector("#loss-stat").textContent = s.played ? `${Math.round(s.losses / s.played * 100)}%` : "0%";
  document.querySelector("#average-stat").textContent = s.wins ? (s.totalWinTries / s.wins).toFixed(1) : "—";
  if (!dialog.open) dialog.showModal();
}

function notify(text, shake = false) {
  message.textContent = text;
  message.classList.remove("show");
  void message.offsetWidth;
  message.classList.add("show");
  if (shake) {
    const row = board.children[guesses.length];
    row.classList.remove("shake"); void row.offsetWidth; row.classList.add("shake");
  }
}

function newGame() {
  answer = words[Math.floor(Math.random() * words.length)];
  guesses = []; current = ""; gameOver = false; locked = false; keyStates = {};
  message.textContent = "";
  buildBoard(); buildKeyboard();
  if (dialog.open) dialog.close();
}

document.addEventListener("keydown", (event) => {
  if (dialog.open && event.key !== "Escape") return;
  handleKey(event.key);
});
document.querySelector("#new-game").addEventListener("click", newGame);
document.querySelector("#stats-button").addEventListener("click", openStats);
document.querySelector("#close-stats").addEventListener("click", () => dialog.close());
document.querySelector("#dialog-new-game").addEventListener("click", newGame);
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

fetch("words.txt")
  .then((response) => { if (!response.ok) throw new Error("Dictionary unavailable"); return response.text(); })
  .then((text) => {
    words = [...new Set(text.split(/\s+/).map((w) => w.toLowerCase()).filter((w) => /^[a-z]{5}$/.test(w)))];
    wordSet = new Set(words);
    document.querySelector("#loading").classList.add("hidden");
    newGame();
  })
  .catch(() => { document.querySelector("#loading").textContent = "Please run this game from a local web server."; });
