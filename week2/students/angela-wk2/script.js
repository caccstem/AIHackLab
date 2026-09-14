const TILE_COUNT = 25;
const TEST_LENGTH = 20;
const LEGACY_COLOR_BEST_KEY = "hue-hunt-best";
const COLOR_BEST_PREFIX = "hue-hunt-best-";
const VISION_BEST_KEY = "hue-hunt-vision-best";

const appShell = document.querySelector(".app-shell");
const introScreen = document.querySelector("#intro-screen");
const gameScreen = document.querySelector("#game-screen");
const board = document.querySelector("#board");
const startButton = document.querySelector("#start-button");
const visionButton = document.querySelector("#vision-button");
const playAgainButton = document.querySelector("#play-again-button");
const backHomeButton = document.querySelector("#back-home-button");
const gameOverModal = document.querySelector("#game-over-modal");
const difficultyModal = document.querySelector("#difficulty-modal");
const scoreDisplay = document.querySelector("#score");
const scoreLabel = document.querySelector("#score-label");
const roundDisplay = document.querySelector("#round-number");
const progressLabel = document.querySelector("#progress-label");
const headerBest = document.querySelector("#header-best");
const headerBestLabel = document.querySelector("#header-best-label");
const finalScore = document.querySelector("#final-score");
const finalBest = document.querySelector("#final-best");
const finalScoreLabel = document.querySelector("#final-score-label");
const finalBestLabel = document.querySelector("#final-best-label");
const resultEyebrow = document.querySelector("#result-eyebrow");
const resultTitle = document.querySelector("#result-title");
const resultCopy = document.querySelector("#result-copy");
const difficultyName = document.querySelector("#difficulty-name");
const difficultyButtons = document.querySelectorAll("[data-difficulty]");
const requestedDifficulty = document.querySelector("#requested-difficulty");
const stayButton = document.querySelector("#stay-button");
const restartButton = document.querySelector("#restart-button");
const timerBlock = document.querySelector("#timer-block");
const timerDisplay = document.querySelector("#timer");
const questionTitle = document.querySelector("#question-title");
const questionRating = document.querySelector("#question-rating");
const gameHint = document.querySelector("#game-hint");

const DIFFICULTIES = {
  easy: { startingGap: 19, shrinkRate: 0.95, minimumGap: 5 },
  medium: { startingGap: 14, shrinkRate: 0.88, minimumGap: 2.2 },
  hard: { startingGap: 9, shrinkRate: 0.8, minimumGap: 1.2 },
  extreme: { startingGap: 9, shrinkRate: 0.8, minimumGap: 1.2 },
};

const VISION_QUESTIONS = [
  { type: "characters", standard: "X", target: "O", difficulty: 1, gridSize: 8 },
  { type: "characters", standard: "D", target: "O", difficulty: 2, gridSize: 8 },
  { type: "scene", target: "ladybug", icon: "🐞", theme: "meadow", difficulty: 3, x: 73, y: 67 },
  { type: "characters", standard: "土", target: "士", difficulty: 4, gridSize: 10 },
  { type: "difference", difficulty: 3, changedIndex: 31, from: "●", to: "◉", seed: 503 },
  { type: "characters", standard: "日", target: "曰", difficulty: 5, gridSize: 10 },
  { type: "scene", target: "key", icon: "🔑", theme: "desk", difficulty: 5, x: 28, y: 76 },
  { type: "characters", standard: "未", target: "末", difficulty: 6, gridSize: 10 },
  { type: "difference", difficulty: 5, changedIndex: 44, from: "✦", to: "★", seed: 509 },
  { type: "characters", standard: "C", target: "G", difficulty: 4, gridSize: 10 },
  { type: "scene", target: "striped fish", icon: "🐠", theme: "ocean", difficulty: 6, x: 81, y: 29 },
  { type: "characters", standard: "王", target: "玉", difficulty: 7, gridSize: 10 },
  { type: "difference", difficulty: 7, changedIndex: 27, from: "◐", to: "◑", seed: 513 },
  { type: "characters", standard: "人", target: "入", difficulty: 7, gridSize: 10 },
  { type: "scene", target: "crescent moon", icon: "🌙", theme: "night", difficulty: 8, x: 18, y: 22 },
  { type: "characters", standard: "己", target: "已", difficulty: 9, gridSize: 10 },
  { type: "difference", difficulty: 8, changedIndex: 38, from: "▰", to: "▬", seed: 517 },
  { type: "characters", standard: "O", target: "0", difficulty: 8, gridSize: 10 },
  { type: "scene", target: "bee", icon: "🐝", theme: "garden", difficulty: 9, x: 62, y: 43 },
  { type: "characters", standard: "口", target: "囗", difficulty: 10, gridSize: 10 },
];

const SCENE_PALETTES = {
  meadow: ["🌼", "🌷", "🌻", "🌿", "🦋", "🌸", "🍓", "🍄", "🐌", "🌱", "🪻", "🍀"],
  desk: ["📕", "✏️", "📎", "📘", "✂️", "📏", "🖊️", "🗒️", "☕", "🖇️", "🖍️", "📐"],
  ocean: ["🪸", "🐚", "🌿", "🫧", "🐟", "🐡", "🦀", "🪼", "🐙", "🦑", "🦐", "🪨"],
  night: ["⭐", "✨", "☁️", "🌟", "🪐", "☄️", "🦉", "🛸", "💫", "🌌", "☁️", "⭐"],
  garden: ["🌺", "🌻", "🌼", "🌷", "🌸", "🦋", "🌿", "🍀", "🐞", "🍓", "🪻", "🌱"],
};

const DIFFERENCE_GLYPHS = ["◆", "●", "▲", "✦", "♣", "◐", "⬟", "✚", "♥", "★", "☂", "◉", "▰", "♠"];

let score = 0;
let oddTileIndex = 0;
let acceptingGuess = false;
let colorBests = readColorBests();
let visionBest = readStoredNumber(VISION_BEST_KEY);
let currentDifficulty = "medium";
let pendingDifficulty = null;
let currentGameMode = "color";
let gameInProgress = false;
let gameTimer = null;
let countdownInterval = null;
let countdownTimeout = null;
let countdownDeadline = 0;
let pausedCountdownRemaining = null;
let endReason = "wrong";
let visionQuestionIndex = 0;
let visionResults = [];
let visionRunSeed = 0;
let questionStartedAt = 0;
let currentQuestion = null;
let currentAnswerElement = null;

headerBest.textContent = colorBests[currentDifficulty];

function readStoredNumber(key) {
  try {
    return Number.parseInt(localStorage.getItem(key), 10) || 0;
  } catch {
    return 0;
  }
}

function saveStoredNumber(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage can be unavailable without preventing play.
  }
}

function readColorBests() {
  const records = Object.fromEntries(
    Object.keys(DIFFICULTIES).map((difficulty) => [
      difficulty,
      readStoredNumber(`${COLOR_BEST_PREFIX}${difficulty}`),
    ]),
  );

  // Preserve scores from versions that had one shared record as the Medium best.
  if (records.medium === 0) records.medium = readStoredNumber(LEGACY_COLOR_BEST_KEY);
  return records;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function makeColors() {
  const hue = randomBetween(0, 359);
  const saturation = randomBetween(48, 72);
  const lightness = randomBetween(43, 61);
  const settings = DIFFICULTIES[currentDifficulty];
  const gap = Math.max(
    settings.minimumGap,
    settings.startingGap * Math.pow(settings.shrinkRate, score),
  );
  const direction = Math.random() > 0.5 ? 1 : -1;
  const oddLightness = Math.min(72, Math.max(30, lightness + gap * direction));

  return {
    standard: `hsl(${hue} ${saturation}% ${lightness}%)`,
    odd: `hsl(${hue} ${saturation}% ${oddLightness}%)`,
  };
}

function clearCountdown() {
  window.clearInterval(countdownInterval);
  window.clearTimeout(countdownTimeout);
  countdownInterval = null;
  countdownTimeout = null;
}

function startCountdown(duration = 5000) {
  clearCountdown();
  timerBlock.hidden = false;
  timerBlock.classList.remove("urgent");
  timerDisplay.textContent = (duration / 1000).toFixed(1);
  countdownDeadline = performance.now() + duration;

  countdownInterval = window.setInterval(() => {
    const remaining = Math.max(0, countdownDeadline - performance.now());
    timerDisplay.textContent = (remaining / 1000).toFixed(1);
    timerBlock.classList.toggle("urgent", remaining <= 2000);
  }, 100);

  countdownTimeout = window.setTimeout(handleColorTimeout, duration);
}

function resetBoard() {
  board.replaceChildren();
  board.className = "board";
  board.style.removeProperty("--grid-size");
  currentAnswerElement = null;
}

function renderRound() {
  window.clearTimeout(gameTimer);
  clearCountdown();
  acceptingGuess = true;
  resetBoard();

  if (currentGameMode === "vision") renderVisionQuestion();
  else renderColorRound();
}

function renderColorRound() {
  oddTileIndex = randomBetween(0, TILE_COUNT - 1);
  const colors = makeColors();
  scoreDisplay.textContent = score;
  scoreLabel.textContent = "Score";
  progressLabel.textContent = "Round";
  roundDisplay.textContent = score + 1;
  difficultyName.textContent = currentDifficulty;
  questionTitle.textContent = "Which one is different?";
  questionRating.hidden = true;
  gameHint.textContent = "Choose the tile with the slightly different shade.";
  timerBlock.hidden = currentDifficulty !== "extreme";
  board.setAttribute("aria-label", "Color tile grid");

  for (let index = 0; index < TILE_COUNT; index += 1) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    tile.style.backgroundColor = index === oddTileIndex ? colors.odd : colors.standard;
    tile.style.animationDelay = `${index * 7}ms`;
    tile.setAttribute("aria-label", `Color tile ${index + 1}`);
    tile.addEventListener("click", () => handleColorGuess(index, tile));
    board.append(tile);
  }

  if (currentDifficulty === "extreme") {
    if (difficultyModal.hidden) startCountdown();
    else pausedCountdownRemaining = 5000;
  }
}

function renderVisionQuestion() {
  currentQuestion = VISION_QUESTIONS[visionQuestionIndex];
  scoreDisplay.textContent = score;
  scoreLabel.textContent = "Correct";
  progressLabel.textContent = "Question";
  roundDisplay.textContent = `${visionQuestionIndex + 1}/${TEST_LENGTH}`;
  difficultyName.textContent = "Vision test";
  questionRating.hidden = false;
  questionRating.textContent = `Difficulty ${currentQuestion.difficulty}/10`;
  timerBlock.hidden = true;
  board.setAttribute("aria-label", "Vision test question");

  if (currentQuestion.type === "characters") renderCharacterQuestion(currentQuestion);
  if (currentQuestion.type === "scene") renderSceneQuestion(currentQuestion);
  if (currentQuestion.type === "difference") renderDifferenceQuestion(currentQuestion);
  questionStartedAt = performance.now();
}

function renderCharacterQuestion(question) {
  const cellCount = question.gridSize ** 2;
  oddTileIndex = randomBetween(0, cellCount - 1);
  board.classList.add("vision-board", "character-board");
  board.style.setProperty("--grid-size", question.gridSize);
  questionTitle.textContent = "Find the odd one out";
  gameHint.textContent = `${question.gridSize} × ${question.gridSize} character grid`;

  for (let index = 0; index < cellCount; index += 1) {
    const tile = document.createElement("button");
    const isAnswer = index === oddTileIndex;
    tile.type = "button";
    tile.className = "tile vision-tile";
    tile.textContent = isAnswer ? question.target : question.standard;
    tile.style.animationDelay = `${Math.min(index * 2, 120)}ms`;
    tile.setAttribute("aria-label", `Character ${index + 1}`);
    tile.addEventListener("click", () => submitVisionAnswer(isAnswer, tile));
    if (isAnswer) currentAnswerElement = tile;
    board.append(tile);
  }
}

function renderSceneQuestion(question) {
  board.classList.add("vision-board", "scene-board");
  questionTitle.textContent = `Find the ${question.target}`;
  gameHint.textContent = "Click the hidden object in the image.";
  const scene = document.createElement("div");
  scene.className = `visual-scene ${question.theme}`;
  scene.setAttribute("role", "img");
  scene.setAttribute("aria-label", `Illustrated scene with a hidden ${question.target}`);

  const random = seededRandom(visionRunSeed + visionQuestionIndex * 997 + question.difficulty * 131);
  const palette = SCENE_PALETTES[question.theme];
  const objectCount = 72 + question.difficulty * 4;
  const targetX = 4 + random() * 92;
  const targetY = 5 + random() * 90;

  for (let index = 0; index < objectCount; index += 1) {
    const object = document.createElement("span");
    object.className = "scene-object";
    object.textContent = palette[Math.floor(random() * palette.length)];
    object.style.left = `${2 + random() * 96}%`;
    object.style.top = `${3 + random() * 94}%`;
    object.style.fontSize = `${14 + random() * 14}px`;
    object.style.opacity = `${0.82 + random() * 0.18}`;
    object.style.transform = `translate(-50%, -50%) rotate(${-22 + random() * 44}deg)`;
    scene.append(object);
  }

  const target = document.createElement("button");
  target.type = "button";
  target.className = "scene-object scene-target";
  target.textContent = question.icon;
  target.style.left = `${targetX}%`;
  target.style.top = `${targetY}%`;
  target.style.fontSize = `${Math.max(16, 23 - question.difficulty * 0.65)}px`;
  target.setAttribute("aria-label", `Hidden ${question.target}`);
  target.addEventListener("click", (event) => {
    event.stopPropagation();
    submitVisionAnswer(true, target);
  });
  currentAnswerElement = target;
  scene.append(target);

  scene.addEventListener("click", (event) => {
    if (!acceptingGuess) return;
    const bounds = scene.getBoundingClientRect();
    const marker = document.createElement("span");
    marker.className = "miss-dot";
    marker.style.left = `${event.clientX - bounds.left}px`;
    marker.style.top = `${event.clientY - bounds.top}px`;
    scene.append(marker);
    submitVisionAnswer(false, marker);
  });
  board.append(scene);
}

function renderDifferenceQuestion(question) {
  board.classList.add("vision-board", "difference-board");
  questionTitle.textContent = "Spot the difference";
  gameHint.textContent = "Click the item that changed in the right image.";
  const wrap = document.createElement("div");
  wrap.className = "difference-wrap";
  const itemCount = question.difficulty <= 3 ? 36 : 48;
  const random = seededRandom(question.seed + visionRunSeed);
  const changedIndex = (question.changedIndex + visionRunSeed) % itemCount;
  const baseItems = Array.from(
    { length: itemCount },
    () => DIFFERENCE_GLYPHS[Math.floor(random() * DIFFERENCE_GLYPHS.length)],
  );
  const itemStyles = Array.from({ length: itemCount }, () => ({
    rotation: -12 + random() * 24,
    shade: 30 + Math.floor(random() * 4) * 12,
  }));
  baseItems[changedIndex] = question.from;

  ["Original", "Changed"].forEach((label, panelIndex) => {
    const panel = document.createElement("div");
    panel.className = "picture-panel";
    panel.dataset.label = label;

    baseItems.forEach((item, index) => {
      const isChangedAnswer = panelIndex === 1 && index === changedIndex;
      const element = isChangedAnswer ? document.createElement("button") : document.createElement("span");
      element.className = `picture-item${isChangedAnswer ? " difference-target" : ""}`;
      element.textContent = isChangedAnswer ? question.to : item;
      element.style.color = `hsl(190 18% ${itemStyles[index].shade}%)`;
      element.style.transform = `rotate(${itemStyles[index].rotation}deg)`;

      if (isChangedAnswer) {
        element.type = "button";
        element.setAttribute("aria-label", "Changed item");
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          submitVisionAnswer(true, element);
        });
        currentAnswerElement = element;
      }
      panel.append(element);
    });

    panel.addEventListener("click", (event) => {
      if (!acceptingGuess) return;
      const chosen = event.target.closest(".picture-item");
      if (chosen) chosen.classList.add("vision-miss");
      submitVisionAnswer(false, chosen || panel);
    });
    wrap.append(panel);
  });
  board.append(wrap);
}

function revealAnswer() {
  if (!currentAnswerElement) return;
  currentAnswerElement.classList.add("revealed");
  currentAnswerElement.setAttribute("aria-label", "Correct answer");
}

function handleColorGuess(index, tile) {
  if (!acceptingGuess) return;
  acceptingGuess = false;
  clearCountdown();

  if (index === oddTileIndex) {
    score += 1;
    tile.classList.add("correct");
    scoreDisplay.textContent = score;
    gameTimer = window.setTimeout(renderRound, 420);
    return;
  }

  gameInProgress = false;
  endReason = "wrong";
  tile.classList.add("wrong");
  currentAnswerElement = board.children[oddTileIndex];
  revealAnswer();
  gameTimer = window.setTimeout(showColorGameOver, 1150);
}

function handleColorTimeout() {
  if (!acceptingGuess || currentGameMode !== "color") return;
  acceptingGuess = false;
  gameInProgress = false;
  endReason = "timeout";
  clearCountdown();
  timerDisplay.textContent = "0.0";
  timerBlock.classList.add("urgent");
  currentAnswerElement = board.children[oddTileIndex];
  revealAnswer();
  gameTimer = window.setTimeout(showColorGameOver, 1150);
}

function submitVisionAnswer(isCorrect, chosenElement) {
  if (!acceptingGuess) return;
  acceptingGuess = false;
  const elapsedSeconds = Math.max(0.1, (performance.now() - questionStartedAt) / 1000);
  visionResults.push({ correct: isCorrect, elapsedSeconds, difficulty: currentQuestion.difficulty });

  if (isCorrect) {
    score += 1;
    scoreDisplay.textContent = score;
    if (chosenElement.classList.contains("tile")) chosenElement.classList.add("correct");
    else chosenElement.classList.add("revealed");
  } else {
    if (chosenElement?.classList.contains("tile")) chosenElement.classList.add("wrong");
    revealAnswer();
  }
  gameTimer = window.setTimeout(advanceVisionTest, 900);
}

function advanceVisionTest() {
  visionQuestionIndex += 1;
  if (visionQuestionIndex >= TEST_LENGTH) finishVisionTest();
  else renderRound();
}

function calculateVisionPercentile() {
  let earned = 0;
  let possible = 0;

  visionResults.forEach((result) => {
    const weight = 0.7 + result.difficulty * 0.08;
    const expectedSeconds = 2.5 + result.difficulty * 0.8;
    possible += weight;
    if (!result.correct) return;
    const speed = Math.min(1, expectedSeconds / result.elapsedSeconds);
    earned += weight * (0.62 + 0.38 * speed);
  });
  return Math.max(0, Math.min(100, Math.round((earned / possible) * 100)));
}

function finishVisionTest() {
  gameInProgress = false;
  const percentile = calculateVisionPercentile();
  const averageSeconds = visionResults.reduce((total, result) => total + result.elapsedSeconds, 0) / TEST_LENGTH;
  if (percentile > visionBest) {
    visionBest = percentile;
    saveStoredNumber(VISION_BEST_KEY, visionBest);
  }

  headerBest.textContent = visionBest;
  headerBestLabel.textContent = "Vision best";
  resultEyebrow.textContent = "Test complete";
  resultTitle.textContent = `${formatOrdinal(percentile)} percentile`;
  resultCopy.textContent = `${getVisionVerdict(percentile)} Average response: ${averageSeconds.toFixed(1)}s.`;
  finalScoreLabel.textContent = "Eyesight percentile";
  finalBestLabel.textContent = "Correct answers";
  finalScore.textContent = percentile;
  finalBest.textContent = `${score}/${TEST_LENGTH}`;
  backHomeButton.hidden = false;
  gameOverModal.hidden = false;
  playAgainButton.focus();
}

function formatOrdinal(value) {
  const finalTwoDigits = value % 100;
  if (finalTwoDigits >= 11 && finalTwoDigits <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

function getVisionVerdict(percentile) {
  if (percentile === 100) return "Perfect accuracy at serious speed. Eagle mode activated.";
  if (percentile >= 85) return "Your eyes are extremely sharp — tiny details do not stand a chance.";
  if (percentile >= 65) return "Strong spotting skills. You handled the tricky details well.";
  if (percentile >= 40) return "A respectable run, with some sneaky details getting through.";
  if (percentile > 0) return "Your eyes chose chaos today XD. A rematch may change everything.";
  return "0th percentile: literally blind XD — according to this very unserious game.";
}

function startGame(mode = currentGameMode) {
  window.clearTimeout(gameTimer);
  clearCountdown();
  currentGameMode = mode;
  score = 0;
  gameInProgress = true;
  pausedCountdownRemaining = null;
  endReason = "wrong";
  visionQuestionIndex = 0;
  visionResults = [];
  if (mode === "vision") visionRunSeed = randomBetween(1, 999999);
  appShell.classList.toggle("vision-mode", mode === "vision");
  headerBest.textContent = mode === "vision" ? visionBest : colorBests[currentDifficulty];
  headerBestLabel.textContent = mode === "vision"
    ? "Vision best"
    : `${currentDifficulty[0].toUpperCase()}${currentDifficulty.slice(1)} best`;
  gameOverModal.hidden = true;
  difficultyModal.hidden = true;
  introScreen.hidden = true;
  gameScreen.hidden = false;
  renderRound();
  board.querySelector("button")?.focus({ preventScroll: true });
}

function showColorGameOver() {
  gameInProgress = false;
  const isNewBest = score > colorBests[currentDifficulty];
  if (isNewBest) {
    colorBests[currentDifficulty] = score;
    saveStoredNumber(`${COLOR_BEST_PREFIX}${currentDifficulty}`, score);
  }

  headerBest.textContent = colorBests[currentDifficulty];
  headerBestLabel.textContent = `${currentDifficulty[0].toUpperCase()}${currentDifficulty.slice(1)} best`;
  resultEyebrow.textContent = "Game over";
  finalScoreLabel.textContent = "Your score";
  finalBestLabel.textContent = "Personal best";
  finalScore.textContent = score;
  finalBest.textContent = colorBests[currentDifficulty];
  backHomeButton.hidden = true;

  if (endReason === "timeout") {
    resultTitle.textContent = "Time’s up!";
    resultCopy.textContent = isNewBest
      ? "The correct tile was highlighted — and you still set a new best!"
      : "The correct tile was highlighted. Ready to try again?";
  } else {
    resultTitle.textContent = isNewBest ? "New personal best!" : score >= 5 ? "Sharp eyes!" : "Good try!";
    resultCopy.textContent = isNewBest
      ? "That’s your best run yet. Think you can top it?"
      : "That was a tricky shade. Ready for another look?";
  }
  gameOverModal.hidden = false;
  playAgainButton.focus();
}

function selectDifficulty(difficulty) {
  currentDifficulty = difficulty;
  difficultyButtons.forEach((option) => {
    const isSelected = option.dataset.difficulty === difficulty;
    option.classList.toggle("active", isSelected);
    option.setAttribute("aria-pressed", String(isSelected));
  });
  difficultyName.textContent = currentDifficulty;
  if (currentGameMode === "color") {
    headerBest.textContent = colorBests[currentDifficulty];
    headerBestLabel.textContent = `${currentDifficulty[0].toUpperCase()}${currentDifficulty.slice(1)} best`;
  }
}

function returnToHueHunt() {
  window.clearTimeout(gameTimer);
  clearCountdown();
  acceptingGuess = false;
  gameInProgress = false;
  currentGameMode = "color";
  appShell.classList.remove("vision-mode");
  gameOverModal.hidden = true;
  gameScreen.hidden = true;
  introScreen.hidden = false;
  backHomeButton.hidden = true;
  headerBest.textContent = colorBests[currentDifficulty];
  headerBestLabel.textContent = `${currentDifficulty[0].toUpperCase()}${currentDifficulty.slice(1)} best`;
  startButton.focus();
}

startButton.addEventListener("click", () => startGame("color"));
visionButton.addEventListener("click", () => startGame("vision"));
playAgainButton.addEventListener("click", () => startGame());
backHomeButton.addEventListener("click", returnToHueHunt);

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextDifficulty = button.dataset.difficulty;
    if (nextDifficulty === currentDifficulty) return;

    if (gameInProgress) {
      pendingDifficulty = nextDifficulty;
      if (currentDifficulty === "extreme" && acceptingGuess) {
        pausedCountdownRemaining = Math.max(0, countdownDeadline - performance.now());
        clearCountdown();
      }
      requestedDifficulty.textContent = nextDifficulty;
      difficultyModal.hidden = false;
      stayButton.focus();
      return;
    }
    selectDifficulty(nextDifficulty);
  });
});

stayButton.addEventListener("click", () => {
  pendingDifficulty = null;
  difficultyModal.hidden = true;
  if (currentDifficulty === "extreme" && acceptingGuess && pausedCountdownRemaining !== null) {
    startCountdown(pausedCountdownRemaining);
  }
  pausedCountdownRemaining = null;
  document.querySelector(`[data-difficulty="${currentDifficulty}"]`)?.focus();
});

restartButton.addEventListener("click", () => {
  if (pendingDifficulty) selectDifficulty(pendingDifficulty);
  pendingDifficulty = null;
  pausedCountdownRemaining = null;
  startGame();
});

difficultyModal.addEventListener("click", (event) => {
  if (event.target === difficultyModal) stayButton.focus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !difficultyModal.hidden) stayButton.click();
});

gameOverModal.addEventListener("click", (event) => {
  if (event.target === gameOverModal) playAgainButton.focus();
});
