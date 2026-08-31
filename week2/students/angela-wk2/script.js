const TILE_COUNT = 25;
const STORAGE_KEY = "hue-hunt-best";

const introScreen = document.querySelector("#intro-screen");
const gameScreen = document.querySelector("#game-screen");
const board = document.querySelector("#board");
const startButton = document.querySelector("#start-button");
const playAgainButton = document.querySelector("#play-again-button");
const modal = document.querySelector("#game-over-modal");
const scoreDisplay = document.querySelector("#score");
const roundDisplay = document.querySelector("#round-number");
const headerBest = document.querySelector("#header-best");
const finalScore = document.querySelector("#final-score");
const finalBest = document.querySelector("#final-best");
const resultTitle = document.querySelector("#result-title");
const resultCopy = document.querySelector("#result-copy");

let score = 0;
let oddTileIndex = 0;
let acceptingGuess = false;
let bestScore = readBestScore();

headerBest.textContent = bestScore;

function readBestScore() {
  try {
    return Number.parseInt(localStorage.getItem(STORAGE_KEY), 10) || 0;
  } catch {
    return 0;
  }
}

function saveBestScore(value) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // The game still works if storage is blocked by the browser.
  }
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeColors() {
  const hue = randomBetween(0, 359);
  const saturation = randomBetween(48, 72);
  const lightness = randomBetween(43, 61);

  // The gap starts obvious, then approaches a demanding but still playable floor.
  const gap = Math.max(2.2, 14 * Math.pow(0.88, score));
  const direction = Math.random() > 0.5 ? 1 : -1;
  const oddLightness = Math.min(72, Math.max(30, lightness + gap * direction));

  return {
    standard: `hsl(${hue} ${saturation}% ${lightness}%)`,
    odd: `hsl(${hue} ${saturation}% ${oddLightness}%)`,
  };
}

function renderRound() {
  acceptingGuess = true;
  board.replaceChildren();
  oddTileIndex = randomBetween(0, TILE_COUNT - 1);
  const colors = makeColors();

  scoreDisplay.textContent = score;
  roundDisplay.textContent = score + 1;

  for (let index = 0; index < TILE_COUNT; index += 1) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    tile.style.backgroundColor = index === oddTileIndex ? colors.odd : colors.standard;
    tile.style.animationDelay = `${index * 7}ms`;
    tile.setAttribute("aria-label", `Color tile ${index + 1}`);
    tile.addEventListener("click", () => handleGuess(index, tile));
    board.append(tile);
  }
}

function handleGuess(index, tile) {
  if (!acceptingGuess) return;
  acceptingGuess = false;

  if (index === oddTileIndex) {
    score += 1;
    tile.classList.add("correct");
    scoreDisplay.textContent = score;
    window.setTimeout(renderRound, 420);
    return;
  }

  tile.classList.add("wrong");
  window.setTimeout(showGameOver, 380);
}

function startGame() {
  score = 0;
  modal.hidden = true;
  introScreen.hidden = true;
  gameScreen.hidden = false;
  renderRound();
  board.querySelector(".tile")?.focus({ preventScroll: true });
}

function showGameOver() {
  const isNewBest = score > bestScore;
  if (isNewBest) {
    bestScore = score;
    saveBestScore(bestScore);
  }

  headerBest.textContent = bestScore;
  finalScore.textContent = score;
  finalBest.textContent = bestScore;
  resultTitle.textContent = isNewBest ? "New personal best!" : score >= 5 ? "Sharp eyes!" : "Good try!";
  resultCopy.textContent = isNewBest
    ? "That’s your best run yet. Think you can top it?"
    : "That was a tricky shade. Ready for another look?";
  modal.hidden = false;
  playAgainButton.focus();
}

startButton.addEventListener("click", startGame);
playAgainButton.addEventListener("click", startGame);

modal.addEventListener("click", (event) => {
  if (event.target === modal) playAgainButton.focus();
});
