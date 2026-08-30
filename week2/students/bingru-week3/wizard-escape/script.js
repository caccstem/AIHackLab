const instructions = document.querySelector("#instructions-dialog");
const instructionsButton = document.querySelector("#instructions-button");
const startButton = document.querySelector("#start-button");
const challengeScreen = document.querySelector("#challenge-screen");
const diningHall = document.querySelector("#dining-hall");

instructionsButton.addEventListener("click", () => instructions.showModal());
document.querySelector("#close-instructions").addEventListener("click", () => instructions.close());

function openStart() {
  if (instructions.open) instructions.close();
  challengeScreen.setAttribute("aria-hidden", "false");
  document.body.classList.add("show-challenge");
  window.setTimeout(() => {
    document.body.classList.add("enter-hall");
    diningHall.hidden = false;
    window.setTimeout(() => {
      document.body.classList.remove("show-challenge");
      challengeScreen.setAttribute("aria-hidden", "true");
    }, 1000);
  }, 2600);
}

startButton.addEventListener("click", openStart);
document.querySelector("#dialog-start").addEventListener("click", openStart);
document.querySelector("#return-button").addEventListener("click", () => {
  document.body.classList.remove("enter-hall");
  diningHall.hidden = true;
});

[instructions].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});
