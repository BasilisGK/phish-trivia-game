const socket = io(); // Connect to backend

// Listen for the game code when a new game is created
socket.on("gameCreated", ({ gameCode }) => {
  console.log("Game Code:", gameCode);
  
  // Create a visible element to show the game code
  const gameCodeDisplay = document.createElement("p");
  gameCodeDisplay.innerHTML = `🎟️ Game Code: <strong>${gameCode}</strong>`;
  gameCodeDisplay.style.textAlign = "center";
  gameCodeDisplay.style.fontSize = "20px";
  gameCodeDisplay.style.marginTop = "20px";

  // Add to top of the body
  document.body.insertBefore(gameCodeDisplay, document.body.firstChild);
});
