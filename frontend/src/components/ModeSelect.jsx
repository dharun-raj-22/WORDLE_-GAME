import React from 'react';

function ModeSelect({ onSelectMode }) {
  return (
    <div className="w-full flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold mb-8 text-center text-wordle-highlight">Wordle</h1>
      <h2 className="text-xl mb-12 text-gray-300">Select Game Mode</h2>
      
      <div className="flex flex-col gap-6 w-full max-w-sm">
        <button 
          onClick={() => onSelectMode('LOCAL')}
          className="bg-gray-800 border-2 border-wordle-border p-6 rounded-xl hover:border-wordle-green transition flex flex-col items-center text-center"
        >
          <span className="text-2xl font-bold mb-2 text-white">Pass & Play</span>
          <span className="text-gray-400 text-sm">Local Single Device. Pass the screen between players.</span>
        </button>

        <button 
          onClick={() => onSelectMode('MULTIPLAYER')}
          className="bg-gray-800 border-2 border-wordle-border p-6 rounded-xl hover:border-[#538d4e] transition flex flex-col items-center text-center"
        >
          <span className="text-2xl font-bold mb-2 text-white">Multiplayer</span>
          <span className="text-gray-400 text-sm">Online Multi-Device. Join with Room Code.</span>
        </button>
      </div>
    </div>
  );
}

export default ModeSelect;
