import { useState, useEffect } from 'react';
import ModeSelect from './components/ModeSelect';
import Lobby from './components/Lobby';
import MultiplayerJoin from './components/MultiplayerJoin';
import Setup from './components/Setup';
import Handoff from './components/Handoff';
import SetWord from './components/SetWord';
import GameBoard from './components/GameBoard';
import Leaderboard from './components/Leaderboard';
import GameOver from './components/GameOver';
import { getLeaderboard } from './api';
import { socket } from './socket';

function App() {
  const [view, setView] = useState('MODE_SELECT'); 
  const [mode, setMode] = useState(null); // 'LOCAL' or 'MULTIPLAYER'
  
  // Local Game State
  const [players, setPlayers] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(4);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [turnId, setTurnId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [roundResult, setRoundResult] = useState(null);

  // Multiplayer Game State
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [mpGameState, setMpGameState] = useState(null);
  
  const fetchLeaderboard = async () => {
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (['SETUP', 'MODE_SELECT', 'LOBBY'].indexOf(view) === -1) {
      fetchLeaderboard();
    }
  }, [view]);

  // Handle Socket Events for Multiplayer
  useEffect(() => {
    socket.on('game_started', (state) => {
      setMpGameState(state);
      setMyPlayerId(socket.id);
      setView('MP_WAITING'); // Will evaluate actual screen below
    });

    socket.on('next_turn_started', (state) => {
      setMpGameState(state);
      setTurnId(null);
      setRoundResult(null);
      setView('MP_WAITING');
    });

    socket.on('word_is_set', ({ turnId }) => {
      setTurnId(turnId);
      // Force re-render of spectator/board
      setMpGameState(prev => ({...prev, secretWord: 'SET'})); 
    });

    socket.on('turn_ended', (result) => {
      setRoundResult(result);
      setView('MP_ROUND_END');
    });

    socket.on('game_over', () => {
      setView('GAME_OVER');
    });

    return () => {
      socket.off('game_started');
      socket.off('next_turn_started');
      socket.off('word_is_set');
      socket.off('turn_ended');
      socket.off('game_over');
    };
  }, []);

  const getSetterGuesser = () => {
    if (mode === 'MULTIPLAYER' && mpGameState) {
      return { setter: mpGameState.activeSetter, guesser: mpGameState.activeGuesser };
    }
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
    if (mode === 'MULTIPLAYER') {
      socket.emit('word_set_multiplayer', { word, turnId: newTurnId });
    } else {
      setView('HANDOFF_GUESSER');
    }
  };

  const handleTurnEnd = (result) => {
    if (mode === 'MULTIPLAYER') {
      socket.emit('turn_ended_multiplayer', result);
    } else {
      setRoundResult(result);
      setView('ROUND_END');
    }
  };

  const handleNextTurn = () => {
    if (mode === 'MULTIPLAYER') {
      socket.emit('next_turn_multiplayer');
      return;
    }

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
    setView('MODE_SELECT');
    if (mode === 'MULTIPLAYER') {
      socket.disconnect();
    }
  };

  const { setter, guesser } = getSetterGuesser();

  // Resolve Multiplayer Views
  let activeMpView = view;
  if (mode === 'MULTIPLAYER' && view === 'MP_WAITING' && mpGameState) {
    if (!mpGameState.secretWord) {
      activeMpView = (myPlayerId === setter?.socketId) ? 'SET_WORD' : 'SPECTATOR_SETTING';
    } else {
      activeMpView = (myPlayerId === guesser?.socketId) ? 'GAME' : 'SPECTATOR_GUESSING';
    }
  }

  const renderHeader = () => {
    if (['MODE_SELECT', 'SETUP', 'LOBBY', 'GAME_OVER'].includes(view)) return null;
    const r = mode === 'MULTIPLAYER' ? mpGameState?.currentRound : currentRound;
    const tR = mode === 'MULTIPLAYER' ? mpGameState?.totalRounds : totalRounds;
    return (
      <div className="w-full shrink-0">
        <Leaderboard leaderboard={leaderboard} currentRound={r} totalRounds={tR} setter={setter} guesser={guesser} />
      </div>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto h-[100dvh] flex flex-col p-2 sm:p-4 bg-[#121213] text-white relative overflow-hidden">
      {renderHeader()}

      <div className="flex-1 flex flex-col justify-center items-center w-full min-h-0">
        {view === 'MODE_SELECT' && (
          <ModeSelect onSelectMode={(m) => {
            if (m === 'LOCAL') {
              setMode('LOCAL');
              setView('SETUP');
            } else if (m === 'HOST') {
              setMode('MULTIPLAYER');
              setView('LOBBY_HOST');
            } else if (m === 'JOIN') {
              setMode('MULTIPLAYER');
              setView('MULTIPLAYER_JOIN');
            }
          }} />
        )}

        {view === 'SETUP' && <Setup onStart={handleGameStart} />}
        
        {view === 'LOBBY_HOST' && (
          <Lobby isHostMode={true} onStartGame={() => {}} onBack={() => setView('MODE_SELECT')} />
        )}

        {view === 'LOBBY_JOIN' && (
          <Lobby isHostMode={false} prefilledName={myPlayerId} onStartGame={() => {}} onBack={() => setView('MODE_SELECT')} />
        )}

        {view === 'MULTIPLAYER_JOIN' && (
          <MultiplayerJoin onJoinRoom={(name) => {
            setMyPlayerId(name); // Temporarily store name to pass to Lobby
            setView('LOBBY_JOIN');
          }} onBack={() => setView('MODE_SELECT')} />
        )}
        
        {/* LOCAL PASS & PLAY */}
        {view === 'HANDOFF_SETTER' && (
          <Handoff title="Setter Handoff" message={`Hand device to ${setter?.name}`} subMessage={`You will set the secret word for ${guesser?.name}`} buttonText={`I am ${setter?.name}`} onNext={() => setView('SET_WORD')} />
        )}
        
        {/* SHARED SET_WORD */}
        {(view === 'SET_WORD' || activeMpView === 'SET_WORD') && (
          <SetWord gameId={gameId || mpGameState?.gameId} setter={setter} guesser={guesser} onWordSet={handleWordSet} />
        )}

        {/* MULTIPLAYER SPECTATOR VIEWS */}
        {activeMpView === 'SPECTATOR_SETTING' && (
          <div className="text-center p-8 bg-gray-900 border-2 border-wordle-border rounded-xl w-full">
            <h2 className="text-3xl font-bold mb-4">Waiting...</h2>
            <p className="text-xl text-gray-400">Waiting for <span className="text-wordle-highlight">{setter?.name}</span> to set the word.</p>
          </div>
        )}

        {/* LOCAL PASS & PLAY */}
        {view === 'HANDOFF_GUESSER' && (
          <Handoff title="Word Set!" message={`Hand device to ${guesser?.name}`} subMessage="The secret word is ready to be guessed." buttonText="Start Guessing" onNext={() => setView('GAME')} />
        )}
        
        {/* SHARED GAME BOARD */}
        {(view === 'GAME' || activeMpView === 'GAME') && (
          <GameBoard turnId={turnId} onTurnEnd={handleTurnEnd} isSpectator={false} />
        )}

        {/* SPECTATOR GAME BOARD */}
        {activeMpView === 'SPECTATOR_GUESSING' && (
          <GameBoard turnId={turnId} onTurnEnd={() => {}} isSpectator={true} guesserName={guesser?.name} />
        )}
        
        {/* SHARED ROUND END */}
        {(view === 'ROUND_END' || view === 'MP_ROUND_END') && roundResult && (
          <div className="text-center p-8 bg-gray-900 border-2 border-wordle-border rounded-xl w-full shadow-2xl z-50">
            <h2 className="text-4xl font-bold mb-6 text-wordle-highlight">{roundResult.is_solved ? 'Word Guessed!' : 'Out of Tries!'}</h2>
            <p className="text-2xl mb-8">
              {roundResult.is_solved ? 
                `${guesser.name} scored ${roundResult.points_earned} pts!` : 
                `${setter.name} gets a bonus point!`}
            </p>
            {(!mpGameState || myPlayerId === mpGameState?.hostId) ? (
              <button onClick={handleNextTurn} className="bg-wordle-green px-10 py-4 rounded text-xl font-bold hover:bg-green-600 active:scale-95 transition">
                Next Turn
              </button>
            ) : (
              <p className="text-gray-400">Waiting for host to proceed...</p>
            )}
          </div>
        )}

        {/* SHARED GAME OVER */}
        {view === 'GAME_OVER' && (
          <GameOver gameId={gameId || mpGameState?.gameId} onPlayAgain={handlePlayAgain} />
        )}
      </div>
    </div>
  );
}

export default App;
