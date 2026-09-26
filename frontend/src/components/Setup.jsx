import { useState } from 'react';
import { initPlayers, startGame } from '../api';

function Setup({ onStart }) {
  const [names, setNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (names.some(n => !n.trim())) {
      setError('All player names are required');
      return;
    }
    setLoading(true);
    try {
      const playersData = await initPlayers(names);
      const gameData = await startGame();
      onStart(playersData, gameData.id);
    } catch (err) {
      setError('Failed to start game. Is the backend running?');
    }
    setLoading(false);
  };

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-8 text-center">Pass & Play Wordle</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            className="p-3 bg-transparent border-2 border-wordle-border rounded text-center text-xl focus:border-wordle-highlight outline-none"
            maxLength={15}
          />
        ))}
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        <button 
          type="submit" 
          disabled={loading}
          className="mt-4 bg-wordle-green p-4 rounded text-xl font-bold hover:bg-green-600 active:scale-95 transition disabled:opacity-50"
        >
          {loading ? 'Starting...' : 'Start Game'}
        </button>
      </form>
    </div>
  );
}

export default Setup;
