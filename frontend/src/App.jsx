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
    const guesser = players[(currentTurnIdx + 1) % 4];
    return { setter, guesser };
  };

  const handleGameStart = (playersData, newGameId) => {
    setPlayers(playersData);
    setGameId(newGameId);
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
    
    if (nextTurn >= 4) {
      nextTurn = 0;
      nextRound += 1;
    }

    if (nextRound > 4) {
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
    <div className="w-full max-w-lg mx-auto h-full flex flex-col p-4 bg-wordle-dark text-white relative">
      {view !== 'SETUP' && view !== 'GAME_OVER' && (
        <Leaderboard leaderboard={leaderboard} currentRound={currentRound} setter={setter} guesser={guesser} />
      )}

      <div className="flex-grow flex flex-col justify-center items-center w-full">
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
