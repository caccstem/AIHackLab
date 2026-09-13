const WORDS = {
  4: ["ABLE","AREA","ARMY","BACK","BALL","BAND","BANK","BEAR","BIRD","BLUE","BOAT","BODY","BOLD","BONE","BOOK","BURN","CALM","CARD","CARE","CITY","CLAY","CLUB","COAT","CODE","COLD","DARK","DAWN","DEAL","DEAR","DEEP","DISH","DOOR","DOWN","DRAW","DROP","EACH","EAST","EASY","EDGE","FACE","FACT","FAIR","FALL","FARM","FAST","FEAR","FEEL","FIRE","FISH","FLOW","FOOD","GAME","GATE","GIFT","GIVE","GLOW","GOAL","GOLD","GOOD","GRAY","GROW","HAND","HARD","HEAD","HEAT","HIGH","HOME","HOPE","IDEA","IRON","KEEP","KIND","KING","KNOW","LAKE","LAND","LEAF","LIFE","LINE","LIVE","LONG","LOVE","LUCK","MAIN","MAKE","MIND","MOON","MOVE","NAME","NEAR","NEST","NEWS","OPEN","OVER","PARK","PATH","PLAN","PLAY","RAIN","READ","REAL","RING","RISE","ROAD","ROCK","ROOM","ROSE","SAND","SHIP","SHOW","SNOW","SONG","STAR","STEP","TEAM","TIME","TREE","TRUE","WALK","WALL","WARM","WAVE","WIND","WOOD","WORD","WORK"],
  5: FIVE_LETTER_WORDS,
  6: ["ABSENT","ANIMAL","ANSWER","BEAUTY","BRIGHT","CAMERA","CANDLE","CHANGE","CHOICE","CIRCLE","COFFEE","CORNER","CREATE","DANGER","DESERT","DOUBLE","ENERGY","FAMILY","FLOWER","FOREST","FRIEND","GARDEN","GENTLE","GOLDEN","GROUND","GROWTH","HEALTH","ISLAND","LITTLE","MARKET","MOMENT","MOTHER","NATURE","ORANGE","PEOPLE","PLANET","POCKET","PURPLE","RABBIT","RANDOM","ROCKET","SCHOOL","SECRET","SILVER","SIMPLE","SPRING","SQUARE","STREET","SUMMER","THINGS","TRAVEL","VALLEY","WINTER","WONDER","YELLOW"]
};
WORDS[4] = FOUR_LETTER_WORDS;

const MODES = {
  mal: {label:"GAME 01 / MALWORDLE", title:"The answer is<br><i>never settled.</i>", description:"Every guess makes the secret word change—but every clue stays honest. Corner the game until only one word remains.", status:"Type any {n}-letter word to begin.", limit:8},
  anti: {label:"GAME 02 / ANTIWORDLE", title:"Whatever you do,<br><i>don't solve it.</i>", description:"Keep guessing without finding the answer. Every clue becomes a rule your next word must follow.", status:"Avoid the hidden {n}-letter word.", limit:10},
  classic: {label:"GAME 03 / WORDLE", title:"The classic.<br><i>Your way.</i>", description:"One fixed secret word, six tries, and your choice of word length.", status:"Find the hidden {n}-letter word.", limit:6},
  proxim: {label:"GAME 04 / PROXIMLE", title:"How far away<br><i>are you?</i>", description:"Each letter's alphabet distance from the target is added up. Red means warmer than your last guess; blue means colder.", status:"Make a five-letter guess to set your distance.", limit:8},
  mutat: {label:"GAME 05 / MUTATLE", title:"One letter<br><i>at a time.</i>", description:"Transform the starting word into the target. Every step must be a valid word that changes exactly one letter.", status:"Change exactly one letter from the current word.", limit:10},
  censor: {label:"GAME 06 / CENSORLE", title:"Read between<br><i>the redactions.</i>", description:"Common words remain visible. Guess a hidden word from the definition to reveal every occurrence.", status:"Uncover the dictionary entry.", limit:1}
};

const LADDERS = [
  ["COLD","CORD","CARD","WARD","WARM"],
  ["HEAD","HEAL","TEAL","TELL","TALL"],
  ["SAND","SEND","SEED","FEED","FEEL"],
  ["FOOL","POOL","POLL","POLE","PALE"],
  ["DARK","BARK","BARN","BORN","BONE"]
];
const ENTRIES = [
  {word:"SERENDIPITY", definition:"the occurrence and development of events by chance in a happy or beneficial way"},
  {word:"NOSTALGIA", definition:"a sentimental longing or wistful affection for a period in the past"},
  {word:"LABYRINTH", definition:"a complicated irregular network of passages or paths in which it is difficult to find one's way"},
  {word:"ELOQUENT", definition:"fluent or persuasive in speaking or writing with a graceful and effective use of language"},
  {word:"EPHEMERAL", definition:"lasting for a very short time and quickly fading or disappearing"},
  {word:"RESILIENT", definition:"able to withstand or recover quickly from difficult conditions"},
  {word:"MELLIFLUOUS", definition:"pleasantly smooth and musical to hear especially when describing a voice or words"}
];
const SIMPLE_WORDS = new Set(["a","an","and","as","at","be","by","for","from","in","is","it","of","on","or","the","to","with"]);
const keyboardRows = [[..."QWERTYUIOP"],[..."ASDFGHJKL"],["ENTER",..."ZXCVBNM","⌫"]];
const $ = selector => document.querySelector(selector);
const board = $("#board"), keyboard = $("#keyboard"), toast = $("#toast"), specialPanel = $("#specialPanel");

let mode = "mal", length = 5, answer, candidates, guesses, current, gameOver, toastTimer;
let previousDistance, ladder, ladderPosition, censorEntry, censorRevealed;

function score(guess, target) {
  const result = Array(length).fill("absent"), remaining = {};
  [...target].forEach((letter, index) => {
    if (guess[index] === letter) result[index] = "correct";
    else remaining[letter] = (remaining[letter] || 0) + 1;
  });
  [...guess].forEach((letter, index) => {
    if (result[index] !== "correct" && remaining[letter] > 0) {
      result[index] = "present";
      remaining[letter]--;
    }
  });
  return result;
}

const signature = result => result.map(state => state[0]).join("");
const differsByOne = (a, b) => [...a].filter((letter, i) => letter !== b[i]).length === 1;
const isValidGuess = word => WORDS[length].includes(word);

function buildBoard() {
  board.innerHTML = "";
  for (let r = 0; r < MODES[mode].limit; r++) {
    const row = document.createElement("div");
    row.className = "row";
    row.style.gridTemplateColumns = `repeat(${length},1fr)`;
    for (let c = 0; c < length; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.setAttribute("aria-label", `Row ${r + 1}, letter ${c + 1}`);
      row.append(tile);
    }
    board.append(row);
  }
}

function buildKeyboard() {
  keyboard.innerHTML = "";
  keyboardRows.forEach(keys => {
    const row = document.createElement("div");
    row.className = "key-row";
    keys.forEach(letter => {
      const key = document.createElement("button");
      key.className = `key ${letter.length > 1 ? "wide" : ""}`;
      key.textContent = letter;
      key.dataset.key = letter;
      key.onclick = () => handleKey(letter);
      row.append(key);
    });
    keyboard.append(row);
  });
}

function newGame() {
  if (mode !== "classic") length = mode === "mutat" ? 4 : 5;
  document.querySelectorAll("[data-length]").forEach(button => button.classList.toggle("active", +button.dataset.length === length));
  answer = WORDS[length][Math.floor(Math.random() * WORDS[length].length)];
  candidates = [...WORDS[length]];
  guesses = [];
  current = "";
  gameOver = false;
  previousDistance = null;
  $("#gameStatus").textContent = MODES[mode].status.replace("{n}", length);
  $("#attemptCounter").textContent = `GUESS 1 / ${MODES[mode].limit}`;
  $(".game-console").classList.toggle("censor-game", mode === "censor");
  specialPanel.hidden = !["mutat","censor"].includes(mode);

  if (mode === "mutat") {
    ladder = LADDERS[Math.floor(Math.random() * LADDERS.length)];
    if (Math.random() > .5) ladder = [...ladder].reverse();
    ladderPosition = ladder[0];
    answer = ladder.at(-1);
    renderLadder();
  } else if (mode === "censor") {
    censorEntry = ENTRIES[Math.floor(Math.random() * ENTRIES.length)];
    censorRevealed = new Set();
    renderCensor();
  } else {
    specialPanel.innerHTML = "";
  }
  buildBoard();
  buildKeyboard();
  renderStats();
}

function setMode(next) {
  mode = next;
  document.querySelectorAll(".mode-card").forEach(card => card.classList.toggle("active", card.dataset.mode === mode));
  const config = MODES[mode];
  $("#gameLabel").textContent = config.label;
  $("#gameTitle").innerHTML = config.title;
  $("#gameDescription").textContent = config.description;
  $("#consoleMode").textContent = mode.toUpperCase() + (["mal","anti"].includes(mode) ? "WORDLE" : mode === "classic" ? "" : "LE");
  if (mode === "classic") $("#consoleMode").textContent = "WORDLE";
  $("#lengthControl").classList.toggle("hidden", mode !== "classic");
  newGame();
  $(".playground").scrollIntoView({behavior:"smooth", block:"start"});
}

function renderStats() {
  $("#statOne").textContent = guesses.length || "—";
  $("#statOneLabel").textContent = mode === "anti" ? "SURVIVED" : mode === "mutat" ? "MOVES" : "GUESSES";
  $("#statTwo").textContent = mode === "mal" ? candidates.length : mode === "classic" ? length : mode === "proxim" && previousDistance !== null ? previousDistance : "—";
  $("#statTwoLabel").textContent = mode === "mal" ? "WORDS LEFT" : mode === "proxim" ? "DISTANCE" : mode === "mutat" ? "TARGET" : "WORD LENGTH";
  if (mode === "mutat") $("#statTwo").textContent = answer;
  if (mode === "censor") {
    $("#statOne").textContent = censorRevealed.size || "—";
    $("#statOneLabel").textContent = "REVEALED";
    $("#statTwo").textContent = gameOver ? censorEntry.word : "—";
    $("#statTwoLabel").textContent = "ENTRY";
  }
}

function renderCurrent() {
  const row = board.children[guesses.length];
  if (!row) return;
  [...row.children].forEach((tile, i) => {
    tile.textContent = current[i] || "";
    tile.classList.toggle("filled", Boolean(current[i]));
  });
}

function handleKey(key) {
  if (gameOver || mode === "censor") return;
  if (key === "ENTER") return submitGuess();
  if (key === "⌫" || key === "BACKSPACE") current = current.slice(0, -1);
  else if (/^[A-Z]$/.test(key) && current.length < length) current += key;
  renderCurrent();
}

function malScore(guess) {
  const groups = new Map();
  candidates.forEach(word => {
    const result = score(guess, word), id = signature(result);
    if (!groups.has(id)) groups.set(id, {score:result, words:[]});
    groups.get(id).words.push(word);
  });
  const choices = [...groups.values()].sort((a, b) => b.words.length - a.words.length);
  const pick = choices.find(choice => !choice.score.every(state => state === "correct")) || choices[0];
  candidates = pick.words;
  answer = candidates[Math.floor(Math.random() * candidates.length)];
  return pick.score;
}

function submitGuess() {
  const row = board.children[guesses.length];
  if (current.length !== length) return reject("Not enough letters", row);
  if (!isValidGuess(current)) return reject("Not in the word list", row);
  if (mode === "anti" && !guesses.every(old => signature(score(old.word, current)) === signature(old.score))) return reject("That word doesn't use every clue", row);
  if (mode === "mutat" && !differsByOne(current, ladderPosition)) return reject("Change exactly one letter", row);

  const word = current;
  if (mode === "proxim") return submitProximity(word, row);
  if (mode === "mutat") return submitMutation(word, row);
  const result = mode === "mal" ? malScore(word) : score(word, answer);
  commitWord(word, result, row);
}

function commitWord(word, result, row) {
  guesses.push({word, score:result});
  current = "";
  [...row.children].forEach((tile, i) => setTimeout(() => {
    tile.classList.add("reveal", result[i]);
    updateKey(word[i], result[i]);
  }, i * 110));
  setTimeout(() => finishTurn(result.every(state => state === "correct"), row), length * 110 + 200);
  renderStats();
}

function submitProximity(word, row) {
  const letterDistances = [...word].map((letter, i) => Math.abs(letter.charCodeAt(0) - answer.charCodeAt(i)));
  const distance = letterDistances.reduce((total, value) => total + value, 0);
  const direction = previousDistance === null ? "start" : distance < previousDistance ? "closer" : distance > previousDistance ? "farther" : "same";
  guesses.push({word, distance});
  current = "";
  row.classList.add("proximity");
  [...row.children].forEach((tile, i) => {
    const hue = Math.round((letterDistances[i] / 25) * 225);
    const color = `hsl(${hue} 68% 48%)`;
    tile.style.background = color;
    tile.style.borderColor = color;
    tile.style.color = "white";
    tile.classList.add("reveal");
    tile.title = `Letter distance: ${letterDistances[i]}`;
    tile.setAttribute("aria-label", `${word[i]}, alphabet distance ${letterDistances[i]}`);
  });
  const badge = document.createElement("span");
  badge.className = "distance-badge";
  badge.innerHTML = `<b>${distance}</b>${direction.toUpperCase()}`;
  row.append(badge);
  previousDistance = distance;
  const won = distance === 0;
  if (won || guesses.length === MODES.proxim.limit) finishTurn(won, row);
  else {
    $("#gameStatus").textContent = direction === "start" ? "Baseline set. Now get closer." : direction === "closer" ? "Warmer—your total distance dropped." : direction === "farther" ? "Colder—your total distance increased." : "Exactly the same distance.";
    $("#attemptCounter").textContent = `GUESS ${guesses.length + 1} / ${MODES.proxim.limit}`;
  }
  renderStats();
}

function submitMutation(word, row) {
  const changedIndex = [...word].findIndex((letter, i) => letter !== ladderPosition[i]);
  guesses.push({word});
  current = "";
  ladderPosition = word;
  [...row.children].forEach((tile, i) => {
    tile.classList.add(i === changedIndex ? "present" : "correct", "reveal");
  });
  renderLadder();
  const won = word === answer;
  if (won || guesses.length === MODES.mutat.limit) finishTurn(won, row);
  else {
    $("#gameStatus").textContent = "Valid mutation. Change one more letter.";
    $("#attemptCounter").textContent = `MOVE ${guesses.length + 1} / ${MODES.mutat.limit}`;
  }
  renderStats();
}

function renderLadder() {
  specialPanel.innerHTML = `<div class="ladder-route"><span><small>CURRENT</small>${ladderPosition}</span><span class="ladder-arrow">→</span><span><small>TARGET</small>${answer}</span></div>`;
}

function renderCensor() {
  const tokens = censorEntry.definition.match(/[A-Za-z']+|[^A-Za-z']+/g);
  const definition = tokens.map(token => {
    if (!/^[A-Za-z']+$/.test(token)) return token;
    const clean = token.toLowerCase().replace(/[^a-z]/g, "");
    if (SIMPLE_WORDS.has(clean)) return token;
    const revealed = censorRevealed.has(clean);
    return `<span class="${revealed ? "revealed" : "redacted"}" data-word="${clean}">${token}</span>`;
  }).join("");
  specialPanel.innerHTML = `<div class="definition"><span class="game-label">A MYSTERY DICTIONARY ENTRY</span><p>${definition}</p></div><form class="censor-form"><input aria-label="Guess a redacted word" autocomplete="off" placeholder="GUESS A HIDDEN WORD"><button>REVEAL</button></form>`;
  specialPanel.querySelector("form").onsubmit = event => {
    event.preventDefault();
    const input = specialPanel.querySelector("input");
    const guess = input.value.trim().toLowerCase();
    input.value = "";
    if (!guess) return;
    const hiddenWords = new Set(censorEntry.definition.toLowerCase().match(/[a-z']+/g).map(word => word.replace(/[^a-z]/g, "")).filter(word => !SIMPLE_WORDS.has(word)));
    if (!hiddenWords.has(guess)) {
      const allWords = censorEntry.definition.toLowerCase().match(/[a-z']+/g).map(word => word.replace(/[^a-z]/g, ""));
      return flash(allWords.includes(guess) ? "That word is already visible" : "That word isn't in the entry");
    }
    if (censorRevealed.has(guess)) return flash("Already revealed");
    censorRevealed.add(guess);
    renderCensor();
    const remaining = [...hiddenWords].filter(word => !censorRevealed.has(word));
    if (!remaining.length) {
      gameOver = true;
      $("#statTwo").textContent = censorEntry.word;
      flash(`Entry uncovered: ${censorEntry.word}`);
    } else flash(`Revealed every “${guess}”`);
    renderStats();
  };
}

function finishTurn(won, row) {
  const limit = MODES[mode].limit;
  if (won) {
    gameOver = true;
    row.classList.add("win");
    if (mode === "anti") {
      $("#gameStatus").textContent = `Oops—you found ${answer} after ${guesses.length} guesses.`;
      flash("Caught the word!");
    } else {
      $("#gameStatus").textContent = mode === "mutat" ? `Ladder complete in ${guesses.length} moves.` : `Solved in ${guesses.length} guesses.`;
      flash(mode === "mutat" ? "Mutation complete!" : "Beautiful work!");
    }
  } else if (guesses.length === limit) {
    gameOver = true;
    $("#gameStatus").textContent = mode === "anti" ? `You escaped! The word was ${answer}.` : `Out of guesses. The answer was ${answer}.`;
    flash(mode === "anti" ? "Antiwordle victory!" : answer);
  } else {
    $("#attemptCounter").textContent = `GUESS ${guesses.length + 1} / ${limit}`;
    if (mode === "mal") $("#gameStatus").textContent = candidates.length === 1 ? "Only one possible word remains." : `${candidates.length} possible words are still moving.`;
    if (mode === "anti") $("#gameStatus").textContent = "Good. Keep avoiding the answer—and obey the clues.";
  }
  renderStats();
}

function updateKey(letter, state) {
  const key = document.querySelector(`[data-key="${letter}"]`);
  const rank = {absent:1, present:2, correct:3};
  const old = ["absent","present","correct"].find(value => key.classList.contains(value));
  if (!old || rank[state] > rank[old]) {
    key.classList.remove("absent","present","correct");
    key.classList.add(state);
  }
}

function reject(message, row) {
  flash(message);
  row.classList.add("shake");
  setTimeout(() => row.classList.remove("shake"), 350);
}
function flash(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1700);
}

document.querySelectorAll(".mode-card").forEach(card => card.onclick = () => setMode(card.dataset.mode));
document.querySelectorAll("[data-length]").forEach(button => button.onclick = () => {
  length = +button.dataset.length;
  document.querySelectorAll("[data-length]").forEach(other => other.classList.toggle("active", other === button));
  newGame();
});
$("#newGameButton").onclick = newGame;
document.addEventListener("keydown", event => {
  if (event.ctrlKey || event.metaKey || event.altKey || mode === "censor") return;
  const key = event.key.toUpperCase();
  if (key === "BACKSPACE" || key === "ENTER" || /^[A-Z]$/.test(key)) {
    event.preventDefault();
    handleKey(key);
  }
});
const dialog = $("#helpDialog");
$("#helpButton").onclick = () => dialog.showModal();
$(".dialog-close").onclick = () => dialog.close();
$(".dialog-play").onclick = () => dialog.close();
newGame();
