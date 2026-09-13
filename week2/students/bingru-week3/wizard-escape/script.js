const instructions = document.querySelector("#instructions-dialog");
const instructionsButton = document.querySelector("#instructions-button");
const startButton = document.querySelector("#start-button");
const challengeScreen = document.querySelector("#challenge-screen");
const diningHall = document.querySelector("#dining-hall");
const playerCube = document.querySelector("#player-cube");
let playerX = 50;
let playerY = 74;

instructionsButton.addEventListener("click", () => instructions.showModal());
document.querySelector("#close-instructions").addEventListener("click", () => instructions.close());

function openStart() {
  if (instructions.open) instructions.close();
  challengeScreen.setAttribute("aria-hidden", "false");
  document.body.classList.add("show-challenge");
  document.body.classList.add("enter-hall");
  diningHall.hidden = false;
  window.startDiningHall3D?.();
  window.setTimeout(() => {
    document.body.classList.remove("show-challenge");
    challengeScreen.setAttribute("aria-hidden", "true");
  }, 700);
}

startButton.addEventListener("click", openStart);
document.querySelector("#dialog-start").addEventListener("click", openStart);
document.querySelector("#home-button").addEventListener("click", () => {
  window.stopDiningHall3D?.();
  document.body.classList.remove("enter-hall");
  document.body.classList.remove("three-active");
  diningHall.hidden = true;
  startButton.focus();
});

function movePlayer(event) {
  if (document.body.classList.contains("three-active")) return;
  if (!document.body.classList.contains("enter-hall")) return;
  const moves = { ArrowUp: [0, -4], w: [0, -4], W: [0, -4], ArrowDown: [0, 4], s: [0, 4], S: [0, 4], ArrowLeft: [-4, 0], a: [-4, 0], A: [-4, 0], ArrowRight: [4, 0], d: [4, 0], D: [4, 0] };
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  playerX = Math.max(8, Math.min(92, playerX + move[0]));
  playerY = Math.max(48, Math.min(85, playerY + move[1]));
  playerCube.style.setProperty("--player-x", `${playerX}%`);
  playerCube.style.setProperty("--player-y", `${playerY}%`);
  playerCube.classList.remove("is-moving");
  void playerCube.offsetWidth;
  playerCube.classList.add("is-moving");
}

document.addEventListener("keydown", movePlayer);

[instructions].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});
