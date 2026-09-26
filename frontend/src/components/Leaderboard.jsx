function Leaderboard({ leaderboard, currentRound, setter, guesser }) {
  return (
    <div className="w-full mb-4 border-b border-wordle-border pb-4">
      <div className="flex justify-between items-center mb-4 text-sm font-bold text-gray-400">
        <div className="bg-wordle-border px-2 py-1 rounded">Round {currentRound}/4</div>
        <div className="flex gap-2">
          <span>Setter: <span className="text-wordle-highlight">{setter?.name}</span></span>
          <span>|</span>
          <span>Guesser: <span className="text-wordle-highlight">{guesser?.name}</span></span>
        </div>
      </div>
      
      <div className="flex justify-between gap-2 overflow-x-auto pb-2">
        {leaderboard.map((p, i) => (
          <div key={i} className="flex flex-col bg-gray-900 px-3 py-1 rounded flex-1 min-w-[70px] text-center shadow-md">
            <span className="text-xs font-bold truncate block w-full">{p.name}</span>
            <span className="text-sm font-bold text-wordle-green">{p.total_points} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Leaderboard;
