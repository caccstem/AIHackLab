const questions = [
  { word: "苹果", choices: ["Apple", "Banana", "Orange", "Grape"], answer: "Apple" },
  { word: "猫", choices: ["Bird", "Fish", "Cat", "Dog"], answer: "Cat" },
  { word: "水", choices: ["Tea", "Water", "Milk", "Juice"], answer: "Water" },
  { word: "书", choices: ["Book", "Chair", "Table", "Pen"], answer: "Book" },
  { word: "朋友", choices: ["Teacher", "Family", "Student", "Friend"], answer: "Friend" },
];

const elements = {
  score: document.querySelector("#score"),
  questionCount: document.querySelector("#question-count"),
  progressPercent: document.querySelector("#progress-percent"),
  progressBar: document.querySelector("#progress-bar"),
  chineseWord: document.querySelector("#chinese-word"),
  choices: document.querySelector("#choices"),
  feedback: document.querySelector("#feedback"),
  nextButton: document.querySelector("#next-button"),
  quizScreen: document.querySelector("#quiz-screen"),
  resultScreen: document.querySelector("#result-screen"),
  finalMessage: document.querySelector("#final-message"),
  restartButton: document.querySelector("#restart-button"),
  soundToggle: document.querySelector("#sound-toggle"),
  speakButton: document.querySelector("#speak-button"),
};

let currentQuestion = 0;
let score = 0;
let soundEnabled = true;
let audioContext;

function getAudioContext() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioContext = new AudioContext();
  }
  return audioContext;
}

async function unlockAudio() {
  const context = getAudioContext();
  if (!context) return null;
  if (context.state === "suspended") await context.resume();
  return context;
}

function playTone(context, frequency, start, duration, type = "sine", volume = 0.24) {
  if (!soundEnabled || !context) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const beginsAt = context.currentTime + start;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, beginsAt);
  gain.gain.setValueAtTime(0.001, beginsAt);
  gain.gain.exponentialRampToValueAtTime(volume, beginsAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, beginsAt + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(beginsAt);
  oscillator.stop(beginsAt + duration + 0.02);
}

async function playSound(name) {
  if (!soundEnabled) return;
  const context = await unlockAudio();
  if (!context) return;

  const sounds = {
    correct: [[523, 0, 0.16], [659, 0.12, 0.16], [784, 0.24, 0.28]],
    wrong: [[220, 0, 0.2, "triangle"], [175, 0.16, 0.3, "triangle"]],
    next: [[440, 0, 0.11], [554, 0.09, 0.15]],
    finish: [[523, 0, 0.18], [659, 0.15, 0.18], [784, 0.3, 0.18], [1047, 0.45, 0.4]],
  };
  sounds[name]?.forEach((tone) => playTone(context, ...tone));
}

function speakCurrentWord() {
  if (!soundEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(questions[currentQuestion].word);
  utterance.lang = "zh-CN";
  utterance.rate = 0.75;
  const mandarinVoice = window.speechSynthesis.getVoices().find((voice) =>
    voice.lang.toLowerCase().startsWith("zh")
  );
  if (mandarinVoice) utterance.voice = mandarinVoice;
  window.speechSynthesis.speak(utterance);
}

function updateSoundToggle() {
  elements.soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  elements.soundToggle.setAttribute("aria-label", soundEnabled ? "Mute sounds" : "Turn sounds on");
  elements.soundToggle.querySelector("span").textContent = soundEnabled ? "🔊" : "🔇";
}

function showQuestion() {
  const question = questions[currentQuestion];
  const progress = Math.round(((currentQuestion + 1) / questions.length) * 100);

  elements.questionCount.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
  elements.progressPercent.textContent = `${progress}%`;
  elements.progressBar.style.width = `${progress}%`;
  elements.chineseWord.textContent = question.word;
  elements.feedback.textContent = "";
  elements.feedback.className = "feedback";
  elements.nextButton.hidden = true;
  elements.choices.replaceChildren();

  question.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.textContent = choice;
    button.addEventListener("click", () => checkAnswer(button, choice));
    elements.choices.append(button);
  });
}

function checkAnswer(selectedButton, selectedChoice) {
  const question = questions[currentQuestion];
  const isCorrect = selectedChoice === question.answer;

  elements.choices.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
    if (button.textContent === question.answer) button.classList.add("correct");
  });

  if (isCorrect) {
    score += 1;
    elements.score.textContent = score;
    elements.feedback.textContent = "Correct! 太棒了! 🎉";
    elements.feedback.classList.add("good");
    playSound("correct");
  } else {
    selectedButton.classList.add("wrong");
    elements.feedback.textContent = `Good try! The answer is ${question.answer}. 🌱`;
    elements.feedback.classList.add("try-again");
    playSound("wrong");
  }

  elements.nextButton.textContent = currentQuestion === questions.length - 1 ? "See my score ✨" : "Next word →";
  elements.nextButton.hidden = false;
  elements.nextButton.focus();
}

function showResults() {
  elements.quizScreen.hidden = true;
  elements.resultScreen.hidden = false;
  elements.finalMessage.textContent = `You scored ${score} out of ${questions.length}. ${score === questions.length ? "Perfect score — you're a vocabulary star! 🌟" : "Keep practicing and watch your Chinese grow! 🌱"}`;
  elements.restartButton.focus();
  playSound("finish");
}

elements.nextButton.addEventListener("click", () => {
  currentQuestion += 1;
  if (currentQuestion < questions.length) {
    playSound("next");
    showQuestion();
  }
  else showResults();
});

elements.restartButton.addEventListener("click", () => {
  playSound("next");
  currentQuestion = 0;
  score = 0;
  elements.score.textContent = score;
  elements.resultScreen.hidden = true;
  elements.quizScreen.hidden = false;
  showQuestion();
});

elements.speakButton.addEventListener("click", speakCurrentWord);

elements.soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  if (!soundEnabled && "speechSynthesis" in window) window.speechSynthesis.cancel();
  updateSoundToggle();
  if (soundEnabled) playSound("next");
});

// Browsers, especially Safari on iOS, require audio to be unlocked directly
// from the first user gesture before later sound effects can play.
document.addEventListener("pointerdown", unlockAudio, { once: true, capture: true });
document.addEventListener("keydown", unlockAudio, { once: true, capture: true });

updateSoundToggle();
showQuestion();
