const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const yearEl = document.querySelector('#year');

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const clickRush = document.querySelector('[data-game="click-rush"]');
if (clickRush) {
  const target = clickRush.querySelector('.target');
  const scoreEl = clickRush.querySelector('.score');
  const timerEl = clickRush.querySelector('.timer');
  const statusText = clickRush.querySelector('.status-text');
  const startBtn = clickRush.querySelector('.start-btn');
  const arena = clickRush.querySelector('.arena');

  let score = 0;
  let timeLeft = 15;
  let timerId = null;
  let playing = false;

  const moveTarget = () => {
    if (!playing) return;
    const rect = arena.getBoundingClientRect();
    const targetSize = 56;
    const maxX = Math.max(0, rect.width - targetSize);
    const maxY = Math.max(0, rect.height - targetSize);

    const x = Math.random() * maxX;
    const y = Math.random() * maxY;

    target.style.left = `${x}px`;
    target.style.top = `${y}px`;
    target.style.display = 'block';
  };

  const stopGame = () => {
    playing = false;
    clearInterval(timerId);
    statusText.textContent = `Time up! Final score: ${score}`;
    target.style.display = 'none';
  };

  startBtn.addEventListener('click', () => {
    score = 0;
    timeLeft = 15;
    scoreEl.textContent = score;
    timerEl.textContent = timeLeft;
    statusText.textContent = 'Hit the target as fast as possible!';
    playing = true;
    moveTarget();

    clearInterval(timerId);
    timerId = setInterval(() => {
      timeLeft -= 1;
      timerEl.textContent = timeLeft;

      if (timeLeft <= 0) {
        stopGame();
      }
    }, 1000);
  });

  target.addEventListener('click', () => {
    if (!playing) return;
    score += 1;
    scoreEl.textContent = score;
    statusText.textContent = 'Nice hit! Keep the streak alive.';
    moveTarget();
  });
}

const guessMaster = document.querySelector('[data-game="guess-master"]');
if (guessMaster) {
  const guessInput = document.getElementById('guessInput');
  const submitBtn = guessMaster.querySelector('.submit-btn');
  const resetBtn = guessMaster.querySelector('.reset-btn');
  const statusEl = guessMaster.querySelector('.guess-status');
  const attemptsEl = guessMaster.querySelector('.attempts');

  let answer = Math.floor(Math.random() * 100) + 1;
  let attempts = 0;

  const resetGame = () => {
    answer = Math.floor(Math.random() * 100) + 1;
    attempts = 0;
    attemptsEl.textContent = attempts;
    statusEl.textContent = 'I’m thinking of a number. Can you find it?';
    guessInput.value = '';
    guessInput.focus();
  };

  submitBtn.addEventListener('click', () => {
    const guess = Number(guessInput.value);

    if (!guess || guess < 1 || guess > 100) {
      statusEl.textContent = 'Enter a valid number between 1 and 100.';
      return;
    }

    attempts += 1;
    attemptsEl.textContent = attempts;

    if (guess < answer) {
      statusEl.textContent = 'Too low! Try a higher number.';
    } else if (guess > answer) {
      statusEl.textContent = 'Too high! Try a lower number.';
    } else {
      statusEl.textContent = `Correct! ${answer} was the number. New round started!`;
      setTimeout(resetGame, 900);
    }

    guessInput.value = '';
    guessInput.focus();
  });

  resetBtn.addEventListener('click', resetGame);
}

const reactionGame = document.querySelector('[data-game="reaction-test"]');
if (reactionGame) {
  const reactionBox = reactionGame.querySelector('.reaction-box');
  const reactionStatus = reactionGame.querySelector('.reaction-status');
  const reactionBtn = reactionGame.querySelector('.reaction-btn');

  let waiting = false;
  let startTime = 0;
  let timerId = null;

  const resetReaction = () => {
    waiting = false;
    clearTimeout(timerId);
    reactionBox.classList.remove('ready', 'waiting');
    reactionBox.textContent = 'Wait for green...';
  };

  reactionBtn.addEventListener('click', () => {
    resetReaction();
    reactionStatus.textContent = 'Wait for green...';
    reactionBox.classList.add('waiting');
    reactionBox.textContent = 'Hold steady...';

    const delay = 1200 + Math.random() * 2200;
    timerId = setTimeout(() => {
      waiting = true;
      startTime = performance.now();
      reactionBox.classList.remove('waiting');
      reactionBox.classList.add('ready');
      reactionBox.textContent = 'CLICK!';
      reactionStatus.textContent = 'Click now!';
    }, delay);
  });

  reactionBox.addEventListener('click', () => {
    if (!waiting) {
      clearTimeout(timerId);
      reactionStatus.textContent = 'Too soon! Press Go to try again.';
      reactionBox.classList.remove('waiting', 'ready');
      reactionBox.textContent = 'Too soon!';
      waiting = false;
      return;
    }

    const reactionTime = Math.round(performance.now() - startTime);
    reactionStatus.textContent = `Reaction time: ${reactionTime}ms`;
    reactionBox.classList.remove('ready');
    reactionBox.textContent = 'Nice!';
    waiting = false;
  });
}
