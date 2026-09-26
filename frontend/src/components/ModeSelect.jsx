import React from 'react';

function ModeSelect({ onSelectMode }) {
  return (
    <div className="w-full flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold mb-8 text-center text-wordle-highlight">Wordle</h1>
      <h2 className="text-xl mb-8 text-gray-300">Select Game Mode</h2>
      
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button 
          onClick={() => onSelectMode('LOCAL')}
          className="bg-gray-800 border-2 border-wordle-border p-4 rounded-xl hover:border-wordle-green transition flex flex-col items-center text-center"
        >
          <span className="text-2xl font-bold mb-1 text-white">Pass & Play</span>
          <span className="text-gray-400 text-xs">Local Single Device</span>
        </button>

        <button 
          onClick={() => onSelectMode('HOST')}
          className="bg-gray-800 border-2 border-wordle-border p-4 rounded-xl hover:border-[#538d4e] transition flex flex-col items-center text-center"
        >
          <span className="text-2xl font-bold mb-1 text-white">Create Room</span>
          <span className="text-gray-400 text-xs">Host an Online Match</span>
        </button>

        <button 
          onClick={() => onSelectMode('JOIN')}
          className="bg-gray-800 border-2 border-wordle-border p-4 rounded-xl hover:border-wordle-highlight transition flex flex-col items-center text-center"
        >
          <span className="text-2xl font-bold mb-1 text-white">Join Room</span>
          <span className="text-gray-400 text-xs">Join an existing match</span>
        </button>
      </div>
    </div>
  );
}

export default ModeSelect;
