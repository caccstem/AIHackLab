const instructions = document.querySelector("#instructions-dialog");
const startDialog = document.querySelector("#start-dialog");
const instructionsButton = document.querySelector("#instructions-button");
const startButton = document.querySelector("#start-button");

instructionsButton.addEventListener("click", () => instructions.showModal());
document.querySelector("#close-instructions").addEventListener("click", () => instructions.close());

function openStart() {
  if (instructions.open) instructions.close();
  startDialog.showModal();
}

startButton.addEventListener("click", openStart);
document.querySelector("#dialog-start").addEventListener("click", openStart);
document.querySelector("#continue-button").addEventListener("click", () => {
  startDialog.close();
  document.querySelector(".vault-scene").animate(
    [{ filter: "brightness(1)" }, { filter: "brightness(1.55)" }, { filter: "brightness(1)" }],
    { duration: 1000, easing: "ease-out" }
  );
});

[instructions, startDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});
