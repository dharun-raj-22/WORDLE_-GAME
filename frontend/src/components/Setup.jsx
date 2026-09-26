import { useState, useEffect } from 'react';
import { initPlayers, startGame } from '../api';

function Setup({ onStart }) {
  const [playerCount, setPlayerCount] = useState(4);
  const [names, setNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [roundCount, setRoundCount] = useState(4);

  useEffect(() => {
    setNames(prev => {
      if (playerCount > prev.length) {
        return [...prev, ...Array.from({ length: playerCount - prev.length }, (_, i) => `Player ${prev.length + i + 1}`)];
      } else {
        return prev.slice(0, playerCount);
      }
    });
  }, [playerCount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (names.some(n => !n.trim())) {
      setError('All player names are required');
      return;
    }
    const uniqueNames = new Set(names.map(n => n.trim().toLowerCase()));
    if (uniqueNames.size !== names.length) {
      setError('All player names must be unique');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const playersData = await initPlayers(names.map(n => n.trim()));
      const gameData = await startGame(roundCount);
      onStart(playersData, gameData.id, roundCount);
    } catch (err) {
      setError('Failed to start game. Is the backend running?');
    }
    setLoading(false);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center">Pass & Play Wordle</h1>
      
      <div className="w-full max-w-sm mb-6 bg-gray-900 p-4 rounded-lg border border-wordle-border flex flex-col gap-4">
        <div>
          <label className="block text-center mb-2 font-bold text-gray-300">
            Number of Players: <span className="text-wordle-highlight text-xl ml-2">{playerCount}</span>
          </label>
          <input 
            type="range" 
            min="2" 
            max="8" 
            value={playerCount} 
            onChange={(e) => setPlayerCount(parseInt(e.target.value))}
            className="w-full accent-wordle-green cursor-pointer"
          />
        </div>
        
        <div>
          <label className="block text-center mb-2 font-bold text-gray-300">
            Total Rounds: <span className="text-wordle-highlight text-xl ml-2">{roundCount}</span>
          </label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={roundCount} 
            onChange={(e) => setRoundCount(parseInt(e.target.value))}
            className="w-full accent-wordle-green cursor-pointer"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm overflow-y-auto max-h-[40vh] p-1">
        {names.map((name, i) => (
          <input
            key={i}
            type="text"
            value={name}
            onChange={(e) => {
              const newNames = [...names];
              newNames[i] = e.target.value;
              setNames(newNames);
            }}
            placeholder={`Player ${i + 1}`}
            className="p-3 bg-transparent border-2 border-wordle-border rounded text-center text-lg focus:border-wordle-highlight outline-none"
            maxLength={15}
          />
        ))}
      </form>
      
      <div className="w-full max-w-sm mt-4">
        {error && <p className="text-red-500 text-center mb-2">{error}</p>}
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-wordle-green p-4 rounded text-xl font-bold hover:bg-green-600 active:scale-95 transition disabled:opacity-50"
        >
          {loading ? 'Starting...' : 'Start Game'}
        </button>
      </div>
    </div>
  );
}

export default Setup;
