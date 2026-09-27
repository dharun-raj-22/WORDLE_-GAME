const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected to socket");
  
  // Try to create a room as host
  socket.emit("join_lobby", {
    name: "TestHost",
    isHost: true,
    playerCount: 4,
    roundCount: 4
  });
});

socket.on("lobby_update", (data) => {
  console.log("Lobby update received:", data);
  
  // Now try to check room
  socket.emit("check_room", "22122006", (res) => {
    console.log("Check room response:", res);
    process.exit(0);
  });
});
