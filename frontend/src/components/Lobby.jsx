import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import { initPlayers, startGame } from '../api';

function Lobby({ onStartGame, onBack }) {
  const [name, setName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [playerCount, setPlayerCount] = useState(4);
  const [roundCount, setRoundCount] = useState(4);
  const [lobbyState, setLobbyState] = useState({ players: [], hostId: null });
  
  useEffect(() => {
    socket.connect();
    
    socket.on('lobby_update', (data) => {
      setLobbyState(data);
    });

    socket.on('game_started', (gameState) => {
      onStartGame(gameState);
    });

    return () => {
      socket.off('lobby_update');
      socket.off('game_started');
    };
  }, [onStartGame]);

  const handleJoin = (hostFlag) => {
    if (!name.trim()) return;
    setIsHost(hostFlag);
    socket.emit('join_lobby', { 
      name: name.trim(), 
      isHost: hostFlag, 
      playerCount, 
      roundCount 
    });
    setHasJoined(true);
  };

  const handleStart = async () => {
    try {
      // Sync with DB so we get proper player IDs and game ID for turns
      const dbPlayers = await initPlayers(lobbyState.players.map(p => p.name));
      const gameData = await startGame(roundCount);
      socket.emit('start_multiplayer_game', { dbPlayers, gameId: gameData.id });
    } catch (err) {
      console.error(err);
    }
  };

  if (!hasJoined) {
    return (
      <div className="w-full flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6 text-center">Multiplayer Lobby</h1>
        
        <div className="w-full max-w-sm flex flex-col gap-4 mb-6">
          <input 
            type="text" 
            placeholder="Your Name" 
            value={name}
            onChange={e => setName(e.target.value)}
            className="p-3 bg-transparent border-2 border-wordle-border rounded text-center text-xl focus:border-wordle-highlight outline-none"
          />
        </div>

        <div className="w-full max-w-sm flex flex-col gap-4 mb-8 bg-gray-900 p-4 rounded-xl border border-wordle-border">
          <h3 className="text-center font-bold text-gray-300">Host Settings</h3>
          <div>
            <label className="block text-center text-sm mb-1">Players: {playerCount}</label>
            <input type="range" min="2" max="8" value={playerCount} onChange={e => setPlayerCount(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-center text-sm mb-1">Rounds: {roundCount}</label>
            <input type="range" min="1" max="10" value={roundCount} onChange={e => setRoundCount(Number(e.target.value))} className="w-full" />
          </div>
          <button onClick={() => handleJoin(true)} className="bg-wordle-highlight p-3 rounded font-bold text-white mt-2">Create as Host (22122006)</button>
        </div>

        <div className="w-full max-w-sm">
          <button onClick={() => handleJoin(false)} className="w-full bg-wordle-green p-3 rounded font-bold text-white mb-4">Join Room 22122006</button>
          <button onClick={onBack} className="w-full bg-gray-700 p-3 rounded font-bold text-white">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-2">Room 22122006</h1>
      <p className="text-gray-400 mb-8">Waiting for players...</p>

      <div className="w-full max-w-sm bg-gray-900 rounded-xl p-4 border border-wordle-border mb-8">
        <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Players ({lobbyState.players.length})</h3>
        <ul className="flex flex-col gap-2">
          {lobbyState.players.map((p, i) => (
            <li key={i} className="flex justify-between items-center bg-black p-2 rounded">
              <span>{p.name}</span>
              {p.socketId === lobbyState.hostId && <span className="text-xs bg-wordle-highlight px-2 py-1 rounded">HOST</span>}
            </li>
          ))}
        </ul>
      </div>

      {isHost ? (
        <button onClick={handleStart} className="w-full max-w-sm bg-wordle-green p-4 rounded text-xl font-bold">Start Game</button>
      ) : (
        <p className="text-gray-400">Waiting for host to start the game...</p>
      )}
    </div>
  );
}

export default Lobby;
