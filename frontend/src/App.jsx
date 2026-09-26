import { useState, useEffect } from 'react';
import Setup from './components/Setup';
import Handoff from './components/Handoff';
import SetWord from './components/SetWord';
import GameBoard from './components/GameBoard';
import Leaderboard from './components/Leaderboard';
import GameOver from './components/GameOver';
import { getLeaderboard } from './api';

function App() {
  const [view, setView] = useState('SETUP'); 
  const [players, setPlayers] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(4);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [turnId, setTurnId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [roundResult, setRoundResult] = useState(null);

  const fetchLeaderboard = async () => {
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (view !== 'SETUP') {
      fetchLeaderboard();
    }
  }, [view]);

  const getSetterGuesser = () => {
    if (players.length === 0) return { setter: null, guesser: null };
    const setter = players[currentTurnIdx];
    const guesser = players[(currentTurnIdx + 1) % players.length];
    return { setter, guesser };
  };

  const handleGameStart = (playersData, newGameId, rounds) => {
    setPlayers(playersData);
    setGameId(newGameId);
    setTotalRounds(rounds);
    setCurrentRound(1);
    setCurrentTurnIdx(0);
    setView('HANDOFF_SETTER');
  };

  const handleWordSet = (word, newTurnId) => {
    setTurnId(newTurnId);
    setView('HANDOFF_GUESSER');
  };

  const handleTurnEnd = (result) => {
    setRoundResult(result);
    setView('ROUND_END');
  };

  const handleNextTurn = () => {
    let nextTurn = currentTurnIdx + 1;
    let nextRound = currentRound;
    
    if (nextTurn >= players.length) {
      nextTurn = 0;
      nextRound += 1;
    }

    if (nextRound > totalRounds) {
      setView('GAME_OVER');
    } else {
      setCurrentTurnIdx(nextTurn);
      setCurrentRound(nextRound);
      setView('HANDOFF_SETTER');
    }
  };

  const handlePlayAgain = () => {
    setView('SETUP');
  };

  const { setter, guesser } = getSetterGuesser();

  return (
    <div className="w-full max-w-lg mx-auto h-[100dvh] flex flex-col p-2 sm:p-4 bg-[#121213] text-white relative overflow-hidden">
      {view !== 'SETUP' && view !== 'GAME_OVER' && (
        <div className="w-full shrink-0">
          <Leaderboard leaderboard={leaderboard} currentRound={currentRound} totalRounds={totalRounds} setter={setter} guesser={guesser} />
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center items-center w-full min-h-0">
        {view === 'SETUP' && <Setup onStart={handleGameStart} />}
        
        {view === 'HANDOFF_SETTER' && (
          <Handoff 
            title="Setter Handoff" 
            message={`Hand device to ${setter?.name}`}
            subMessage={`You will set the secret word for ${guesser?.name}`}
            buttonText={`I am ${setter?.name}`}
            onNext={() => setView('SET_WORD')} 
          />
        )}
        
        {view === 'SET_WORD' && (
          <SetWord 
            gameId={gameId} 
            setter={setter} 
            guesser={guesser} 
            onWordSet={handleWordSet} 
          />
        )}
        
        {view === 'HANDOFF_GUESSER' && (
          <Handoff 
            title="Word Set!" 
            message={`Hand device to ${guesser?.name}`}
            subMessage="The secret word is ready to be guessed."
            buttonText="Start Guessing"
            onNext={() => setView('GAME')} 
          />
        )}
        
        {view === 'GAME' && (
          <GameBoard 
            turnId={turnId} 
            onTurnEnd={handleTurnEnd} 
          />
        )}
        
        {view === 'ROUND_END' && roundResult && (
          <div className="text-center p-8 bg-gray-900 border-2 border-wordle-border rounded-xl w-full shadow-2xl z-50">
            <h2 className="text-4xl font-bold mb-6 text-wordle-highlight">{roundResult.is_solved ? 'Word Guessed!' : 'Out of Tries!'}</h2>
            <p className="text-2xl mb-8">
              {roundResult.is_solved ? 
                `${guesser.name} scored ${roundResult.points_earned} pts!` : 
                `${setter.name} gets a bonus point!`}
            </p>
            <button 
              onClick={handleNextTurn}
              className="bg-wordle-green px-10 py-4 rounded text-xl font-bold hover:bg-green-600 active:scale-95 transition"
            >
              Next Turn
            </button>
          </div>
        )}

        {view === 'GAME_OVER' && (
          <GameOver gameId={gameId} onPlayAgain={handlePlayAgain} />
        )}
      </div>
    </div>
  );
}

export default App;
