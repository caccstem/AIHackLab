const WORDS = [
  "ABOUT", "ABOVE", "ALERT", "APPLE", "BEACH", "BERRY", "BLAZE", "BLOOM",
  "BRAVE", "BREAD", "BRICK", "BRING", "BROWN", "CHARM", "CHEER", "CHIME",
  "CLOUD", "CORAL", "CRANE", "CREAM", "DANCE", "DREAM", "DRIFT", "EARTH",
  "FLAME", "FLOUR", "FOCUS", "FRAME", "FRESH", "FROST", "GLASS", "GLOBE",
  "GRACE", "GRAIN", "GRAPE", "GREEN", "HEART", "HONEY", "HOUSE", "LIGHT",
  "LEMON", "MAPLE", "METAL", "MIGHT", "MUSIC", "NIGHT", "NOBLE", "OCEAN",
  "PAINT", "PEACH", "PEARL", "PLANT", "PRIDE", "RIVER", "ROAST", "SHINE",
  "SLATE", "SMILE", "SOLAR", "SOUND", "SPARK", "SPICE", "STONE", "STORM",
  "SWEET", "TABLE", "TIGER", "TOAST", "TRAIL", "WATER", "WHEAT", "WORLD"
];

const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", ["ENTER", ..."ZXCVBNM", "⌫"]];
const board = document.querySelector("#board");
const keyboard = document.querySelector("#keyboard");
const toast = document.querySelector("#toast");
const status = document.querySelector("#gameStatus");
const counter = document.querySelector("#attemptCounter");
let answer, guesses, current, gameOver, toastTimer;

function buildUI() {
  board.innerHTML = "";
  for (let r = 0; r < 6; r++) {
    const row = document.createElement("div");
    row.className = "row";
    row.dataset.row = r;
    for (let c = 0; c < 5; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.setAttribute("aria-label", `Row ${r + 1}, letter ${c + 1}`);
      row.append(tile);
    }
    board.append(row);
  }

  keyboard.innerHTML = "";
  keyboardRows.forEach(keys => {
    const row = document.createElement("div");
    row.className = "key-row";
    [...keys].forEach(letter => {
      const key = document.createElement("button");
      key.className = `key ${letter.length > 1 ? "wide" : ""}`;
      key.textContent = letter;
      key.dataset.key = letter;
      key.setAttribute("aria-label", letter === "⌫" ? "Backspace" : letter);
      key.addEventListener("click", () => handleKey(letter));
      row.append(key);
    });
    keyboard.append(row);
  });
}

function newGame() {
  answer = WORDS[Math.floor(Math.random() * WORDS.length)];
  guesses = [];
  current = "";
  gameOver = false;
  buildUI();
  status.textContent = "Guess the hidden five-letter word.";
  counter.textContent = "1 / 6";
}

function handleKey(key) {
  if (gameOver) return;
  if (key === "ENTER") return submitGuess();
  if (key === "⌫" || key === "BACKSPACE") current = current.slice(0, -1);
  else if (/^[A-Z]$/.test(key) && current.length < 5) current += key;
  renderCurrent();
}

function renderCurrent() {
  const tiles = board.children[guesses.length].children;
  [...tiles].forEach((tile, i) => {
    tile.textContent = current[i] || "";
    tile.classList.toggle("filled", Boolean(current[i]));
  });
}

function scoreGuess(guess) {
  const result = Array(5).fill("absent");
  const remaining = {};
  [...answer].forEach((letter, i) => {
    if (guess[i] === letter) result[i] = "correct";
    else remaining[letter] = (remaining[letter] || 0) + 1;
  });
  [...guess].forEach((letter, i) => {
    if (result[i] !== "correct" && remaining[letter] > 0) {
      result[i] = "present";
      remaining[letter]--;
    }
  });
  return result;
}

function submitGuess() {
  const row = board.children[guesses.length];
  if (current.length !== 5) {
    flash("Not enough letters");
    row.classList.add("shake");
    setTimeout(() => row.classList.remove("shake"), 400);
    return;
  }

  const guess = current;
  const score = scoreGuess(guess);
  guesses.push(guess);
  current = "";
  [...row.children].forEach((tile, i) => {
    setTimeout(() => {
      tile.classList.add("reveal", score[i]);
      updateKey(guess[i], score[i]);
    }, i * 180);
  });

  const revealTime = 5 * 180 + 250;
  if (guess === answer) {
    gameOver = true;
    setTimeout(() => {
      row.classList.add("win");
      status.textContent = guesses.length === 1 ? "Brilliant. First try!" : `Solved in ${guesses.length} tries.`;
      flash("Beautiful work!");
    }, revealTime);
  } else if (guesses.length === 6) {
    gameOver = true;
    setTimeout(() => {
      status.textContent = `The word was ${answer}.`;
      flash(answer);
    }, revealTime);
  } else {
    counter.textContent = `${guesses.length + 1} / 6`;
  }
}

function updateKey(letter, state) {
  const key = document.querySelector(`[data-key="${letter}"]`);
  const priority = { absent: 1, present: 2, correct: 3 };
  const old = ["absent", "present", "correct"].find(s => key.classList.contains(s));
  if (!old || priority[state] > priority[old]) {
    key.classList.remove("absent", "present", "correct");
    key.classList.add(state);
  }
}

function flash(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1500);
}

document.addEventListener("keydown", event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key.toUpperCase();
  if (key === "BACKSPACE" || key === "ENTER" || /^[A-Z]$/.test(key)) {
    event.preventDefault();
    handleKey(key);
  }
});

const dialog = document.querySelector("#helpDialog");
document.querySelector("#helpButton").addEventListener("click", () => dialog.showModal());
document.querySelector("#playButton").addEventListener("click", () => dialog.close());
document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
document.querySelector("#newGameButton").addEventListener("click", newGame);

newGame();
