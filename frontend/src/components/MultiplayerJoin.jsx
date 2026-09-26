import React, { useState } from 'react';
import { socket } from '../socket';

function MultiplayerJoin({ onJoinRoom, onBack }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckRoom = () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    
    // Attempt to connect if not already
    if (!socket.connected) {
      socket.connect();
    }

    // Wait a brief moment for connection to establish if it was offline
    setTimeout(() => {
      socket.emit('check_room', code.trim(), (response) => {
        setLoading(false);
        if (response.valid) {
          setRoomInfo(response);
          setError('');
        } else {
          setError(response.error || 'Invalid room code.');
          setRoomInfo(null);
        }
      });
    }, socket.connected ? 0 : 500);
  };

  const handleJoin = () => {
    if (!name.trim() || !roomInfo) return;
    onJoinRoom(name.trim());
  };

  return (
    <div className="w-full flex flex-col items-center justify-center h-full">
      <h1 className="text-3xl font-bold mb-6 text-center">Join Multiplayer Room</h1>

      <div className="w-full max-w-sm bg-gray-900 p-6 rounded-xl border border-wordle-border mb-6">
        <label className="block mb-2 font-bold text-gray-300">Enter Room Code</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="e.g. 22122006" 
            value={code}
            onChange={e => setCode(e.target.value)}
            disabled={roomInfo !== null}
            className="flex-1 p-3 bg-black border-2 border-wordle-border rounded text-center text-xl focus:border-wordle-highlight outline-none disabled:opacity-50"
          />
          {!roomInfo && (
            <button 
              onClick={handleCheckRoom}
              disabled={loading || !code.trim()}
              className="bg-wordle-green px-4 rounded font-bold text-white disabled:opacity-50 transition"
            >
              Verify
            </button>
          )}
        </div>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>

      {roomInfo && (
        <div className="w-full max-w-sm bg-gray-800 p-6 rounded-xl border border-wordle-highlight mb-6">
          <h3 className="text-xl font-bold mb-4 text-wordle-highlight">Room Found!</h3>
          <ul className="mb-6 space-y-2 text-gray-300 text-sm">
            <li><strong>Host:</strong> {roomInfo.hostName}</li>
            <li><strong>Players:</strong> {roomInfo.playerCount} Total</li>
            <li><strong>Rounds:</strong> {roomInfo.roundCount} Total</li>
          </ul>

          <label className="block mb-2 font-bold text-gray-300">Your Name</label>
          <input 
            type="text" 
            placeholder="Enter your name" 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-3 bg-black border-2 border-wordle-border rounded text-center text-xl mb-4 focus:border-wordle-highlight outline-none"
          />

          <button 
            onClick={handleJoin}
            disabled={!name.trim()}
            className="w-full bg-wordle-highlight p-4 rounded text-xl font-bold text-white disabled:opacity-50 hover:opacity-90 transition"
          >
            Join Room
          </button>
        </div>
      )}

      <button onClick={onBack} className="w-full max-w-sm bg-gray-700 p-3 rounded font-bold text-white mt-auto sm:mt-0">
        Back
      </button>
    </div>
  );
}

export default MultiplayerJoin;
