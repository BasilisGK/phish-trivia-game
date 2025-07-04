// phish_trivia_game (Full Web App with Auto-Advance)

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const questions = require("./questions.json");

let games = {};

io.on("connection", (socket) => {
  socket.on("createGame", () => {
    const gameCode = Math.random().toString(36).substr(2, 5).toUpperCase();
    games[gameCode] = {
      host: socket.id,
      players: {},
      scores: {},
      usedQuestions: new Set(),
      currentQ: null,
      answersReceived: new Set(),
    };
    socket.join(gameCode);
    socket.emit("gameCreated", { gameCode });
  });

  socket.on("joinGame", ({ gameCode, playerName }) => {
    const game = games[gameCode];
    if (!game || Object.keys(game.players).length >= 12) {
      socket.emit("joinError", "Game not found or full");
      return;
    }
    game.players[socket.id] = playerName;
    game.scores[socket.id] = 0;
    socket.join(gameCode);
    io.to(gameCode).emit("playerJoined", {
      players: Object.values(game.players),
    });
  });

  socket.on("startGame", ({ gameCode }) => {
    const game = games[gameCode];
    if (!game) return;
    sendNextQuestion(gameCode);
  });

  socket.on("submitAnswer", ({ gameCode, answer }) => {
    const game = games[gameCode];
    if (!game || !game.currentQ) return;
    const correct = answer === game.currentQ.correct;
    if (correct) game.scores[socket.id]++;
    io.to(socket.id).emit("answerResult", {
      correct,
      fact: game.currentQ.fact,
    });
    game.answersReceived.add(socket.id);

    if (game.answersReceived.size === Object.keys(game.players).length) {
      setTimeout(() => {
        sendNextQuestion(gameCode);
      }, 3000);
    }
  });

  function sendNextQuestion(gameCode) {
    const game = games[gameCode];
    if (!game) return;
    if (game.usedQuestions.size >= 10) {
      endGame(gameCode);
      return;
    }
    let q;
    do {
      q = questions[Math.floor(Math.random() * questions.length)];
    } while (game.usedQuestions.has(q.id));
    game.usedQuestions.add(q.id);
    game.currentQ = q;
    game.answersReceived = new Set();
    io.to(gameCode).emit("newQuestion", {
      question: q.question,
      choices: q.choices,
    });
  }

  function endGame(gameCode) {
    const game = games[gameCode];
    const results = Object.entries(game.scores).map(([id, score]) => ({
      name: game.players[id],
      score,
    }));
    results.sort((a, b) => b.score - a.score);
    io.to(gameCode).emit("gameOver", results);
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
