const COLS = 5;
const MODES = {
  normal: { boards: 1, rows: 6, hint: "Guess the five-letter word in six tries." },
  hard: { boards: 4, rows: 9, hint: "Solve all four words with the same guesses in nine tries." }
};
const KEYS = ["QWERTYUIOP", "ASDFGHJKL", ["ENTER", ..."ZXCVBNM", "⌫"]];
const STORAGE_KEY = "endless-wordle-stats-v1";

let words = [];
let wordSet = new Set();
let mode = "normal";
let answers = [];
let solved = [];
let guesses = [];
let current = "";
let gameOver = false;
let locked = false;
let keyStates = {};
let gameNumber = 0;

const board = document.querySelector("#board");
const keyboard = document.querySelector("#keyboard");
const message = document.querySelector("#message");
const dialog = document.querySelector("#stats-dialog");
const hint = document.querySelector("#hint");

function buildBoard() {
  board.innerHTML = "";
  board.classList.toggle("quordle", mode === "hard");
  for (let puzzle = 0; puzzle < MODES[mode].boards; puzzle++) {
    const puzzleEl = document.createElement("div");
    puzzleEl.className = "puzzle-board";
    puzzleEl.setAttribute("aria-label", mode === "hard" ? `Word ${puzzle + 1}` : "Word");
    for (let row = 0; row < MODES[mode].rows; row++) {
      const rowEl = document.createElement("div");
      rowEl.className = "row";
      for (let col = 0; col < COLS; col++) {
        const tile = document.createElement("div");
        tile.className = "tile";
        rowEl.append(tile);
      }
      puzzleEl.append(rowEl);
    }
    board.append(puzzleEl);
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
  [...board.children].forEach((puzzle, puzzleIndex) => {
    if (solved[puzzleIndex]) return;
    const tiles = puzzle.children[guesses.length]?.children;
    if (!tiles) return;
    for (let i = 0; i < COLS; i++) {
      tiles[i].textContent = current[i] || "";
      tiles[i].classList.toggle("filled", Boolean(current[i]));
    }
  });
}

function scoreGuess(guess, answer) {
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
  const submittedGame = gameNumber;
  const guess = current;
  const rowIndex = guesses.length;
  guesses.push(guess);

  answers.forEach((answer, puzzleIndex) => {
    if (solved[puzzleIndex]) return;
    const result = scoreGuess(guess, answer);
    [...board.children[puzzleIndex].children[rowIndex].children].forEach((tile, index) => {
      setTimeout(() => {
        tile.classList.add(result[index], "reveal");
        updateKey(guess[index], result[index]);
      }, index * 160);
    });
    if (guess === answer) {
      solved[puzzleIndex] = true;
      board.children[puzzleIndex].classList.add("solved");
    }
  });

  setTimeout(() => {
    if (submittedGame !== gameNumber) return;
    current = "";
    locked = false;
    if (solved.every(Boolean)) finishGame(true);
    else if (guesses.length === MODES[mode].rows) finishGame(false);
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
  const answerText = answers.map((answer) => answer.toUpperCase()).join(", ");
  notify(won ? (guesses.length === 1 ? "Genius!" : "You got it!") : `The ${answers.length > 1 ? "words were" : "word was"} ${answerText}`);
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
    [...board.children].forEach((puzzle, index) => {
      if (solved[index]) return;
      const row = puzzle.children[guesses.length];
      row.classList.remove("shake"); void row.offsetWidth; row.classList.add("shake");
    });
  }
}

function newGame() {
  gameNumber += 1;
  const shuffled = [...words].sort(() => Math.random() - .5);
  answers = shuffled.slice(0, MODES[mode].boards);
  solved = Array(MODES[mode].boards).fill(false);
  guesses = []; current = ""; gameOver = false; locked = false; keyStates = {};
  message.textContent = "";
  hint.textContent = MODES[mode].hint;
  document.querySelector(".game").setAttribute("aria-label", mode === "hard" ? "Four-word puzzle" : "Wordle puzzle");
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
document.querySelectorAll('input[name="difficulty"]').forEach((input) => {
  input.addEventListener("change", () => {
    mode = input.value;
    newGame();
  });
});
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
