import { useState, useEffect } from 'react';
import { getGameSummary, getLeaderboard } from '../api';

function GameOver({ gameId, onPlayAgain }) {
  const [summary, setSummary] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sumData, lbData] = await Promise.all([
          getGameSummary(gameId),
          getLeaderboard()
        ]);
        setSummary(sumData);
        setLeaderboard(lbData);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchData();
  }, [gameId]);

  if (loading) return <div>Loading results...</div>;
  if (!summary) return <div>Error loading results.</div>;

  const winner = leaderboard[0];
  const winners = leaderboard.filter(p => p.total_points === winner.total_points);

  return (
    <div className="w-full text-center">
      <h1 className="text-4xl font-bold mb-4">Game Over!</h1>
      <h2 className="text-2xl font-bold mb-8 text-wordle-highlight">
        {winners.length > 1 ? `It's a Tie between ${winners.map(w => w.name).join(' & ')}!` : `${winner.name} Wins!`}
      </h2>
      
      <div className="flex flex-col gap-3 mb-8 overflow-y-auto max-h-[50vh] p-2">
        {leaderboard.map((p, i) => {
          const isWinner = p.total_points === winner.total_points;
          return (
            <div key={i} className={`flex justify-between items-center p-4 rounded ${isWinner ? 'bg-[rgba(83,141,78,0.2)] border-2 border-wordle-green' : 'bg-gray-900 border border-wordle-border'}`}>
              <span className="text-xl font-bold">{i + 1}. {p.name}</span>
              <span className="text-xl font-bold text-wordle-green">{p.total_points} pts</span>
            </div>
          );
        })}
      </div>

      <button 
        onClick={onPlayAgain}
        className="bg-wordle-green px-8 py-4 rounded text-xl font-bold hover:bg-green-600 active:scale-95 transition"
      >
        Play Again
      </button>
    </div>
  );
}

export default GameOver;
