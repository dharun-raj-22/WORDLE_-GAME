const { Server } = require('socket.io');

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const ROOM_CODE = "22122006";
  
  // Basic in-memory state for the multiplayer lobby and game
  const gameState = {
    hostId: null,
    players: [], // { id, name, socketId }
    totalRounds: 4,
    totalPlayers: 4,
    currentRound: 1,
    currentTurnIdx: 0,
    status: 'LOBBY', // LOBBY, IN_PROGRESS, ROUND_END, GAME_OVER
    activeSetter: null,
    activeGuesser: null,
    secretWord: null,
    boardState: [], // To sync spectators
    turnResult: null
  };

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Check Room Before Joining
    socket.on('check_room', (code, callback) => {
      if (code === ROOM_CODE && gameState.hostId) {
        const hostPlayer = gameState.players.find(p => p.socketId === gameState.hostId);
        callback({ 
          valid: true, 
          hostName: hostPlayer?.name || 'Unknown', 
          playerCount: gameState.totalPlayers, 
          roundCount: gameState.totalRounds 
        });
      } else {
        callback({ valid: false, error: 'Room not found or Host has not created it yet.'});
      }
    });

    // Join Lobby
    socket.on('join_lobby', ({ name, isHost, playerCount, roundCount }) => {
      socket.join(ROOM_CODE);
      
      const newPlayer = { id: socket.id, name, socketId: socket.id };
      
      // If host, configure the room
      if (isHost) {
        gameState.hostId = socket.id;
        gameState.players = [newPlayer]; // Reset players if new host
        gameState.totalRounds = roundCount || 4;
        gameState.totalPlayers = playerCount || 4;
        gameState.status = 'LOBBY';
      } else {
        // Only join if room exists and not full (ignoring strict caps for simplicity)
        if (!gameState.players.find(p => p.name === name)) {
            gameState.players.push(newPlayer);
        }
      }
      
      io.to(ROOM_CODE).emit('lobby_update', {
        players: gameState.players,
        hostId: gameState.hostId,
        totalRounds: gameState.totalRounds,
        totalPlayers: gameState.totalPlayers
      });
    });

    // Start Game
    socket.on('start_multiplayer_game', ({ dbPlayers, gameId }) => {
      // Sync DB IDs to memory state
      if (dbPlayers && dbPlayers.length > 0) {
        gameState.players = gameState.players.map((p, idx) => ({
            ...p,
            id: dbPlayers[idx]?.id // Use DB ID for setWord and submitGuess
        }));
      }
      gameState.status = 'IN_PROGRESS';
      gameState.currentRound = 1;
      gameState.currentTurnIdx = 0;
      gameState.gameId = gameId;
      
      // CRITICAL FIX: Reset secretWord and board state when starting a NEW game!
      gameState.secretWord = null;
      gameState.boardState = [];
      gameState.turnResult = null;
      gameState.turnId = null;
      
      updateTurnPointers();
      
      io.to(ROOM_CODE).emit('game_started', gameState);
    });

    // Setter sets the word
    socket.on('word_set_multiplayer', ({ word, turnId }) => {
      gameState.secretWord = word;
      gameState.turnId = turnId;
      gameState.boardState = []; // reset board
      io.to(ROOM_CODE).emit('word_is_set', { turnId });
    });

    // Guesser makes a guess (update spectators)
    socket.on('guess_submitted_multiplayer', (data) => {
      gameState.boardState.push(data); // Append row data
      io.to(ROOM_CODE).emit('spectator_update', gameState.boardState);
    });

    // Turn ends
    socket.on('turn_ended_multiplayer', (result) => {
      gameState.status = 'ROUND_END';
      gameState.turnResult = result;
      io.to(ROOM_CODE).emit('turn_ended', result);
    });

    // Next Turn
    socket.on('next_turn_multiplayer', () => {
      let nextTurn = gameState.currentTurnIdx + 1;
      let nextRound = gameState.currentRound;
      
      if (nextTurn >= gameState.players.length) {
        nextTurn = 0;
        nextRound += 1;
      }
      
      gameState.currentTurnIdx = nextTurn;
      gameState.currentRound = nextRound;
      gameState.secretWord = null;
      gameState.boardState = [];
      
      if (nextRound > gameState.totalRounds) {
        gameState.status = 'GAME_OVER';
        io.to(ROOM_CODE).emit('game_over');
      } else {
        gameState.status = 'IN_PROGRESS';
        updateTurnPointers();
        io.to(ROOM_CODE).emit('next_turn_started', gameState);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // In a real app, handle reconnects or drop player. For this prototype, we'll leave them in memory.
    });
  });

  function updateTurnPointers() {
    const N = gameState.players.length;
    if (N === 0) return;
    gameState.activeSetter = gameState.players[gameState.currentTurnIdx];
    gameState.activeGuesser = gameState.players[(gameState.currentTurnIdx + 1) % N];
  }

  return io;
}

module.exports = initSocket;
