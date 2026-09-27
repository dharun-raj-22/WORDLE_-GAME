import { useState, useEffect, useRef } from 'react';
import Keyboard from './Keyboard';
import { submitGuess } from '../api';
import { socket } from '../socket';

function GameBoard({ turnId, onTurnEnd, isSpectator = false, guesserName }) {
  const [board, setBoard] = useState(
    Array.from({ length: 6 }, () => Array.from({ length: 5 }, () => ({ letter: '', state: '', animate: '' })))
  );
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [keyColors, setKeyColors] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isSpectator) {
      const handleSpectatorUpdate = (boardRows) => {
        // boardRows is an array of rows (each row is 5 tiles)
        const newBoard = Array.from({ length: 6 }, () => Array.from({ length: 5 }, () => ({ letter: '', state: '', animate: '' })));
        const newKeyColors = {};
        
        boardRows.forEach((row, rIdx) => {
          row.forEach((tile, cIdx) => {
            newBoard[rIdx][cIdx] = tile;
            if (tile.state === 'green') newKeyColors[tile.letter] = 'green';
            else if (tile.state === 'yellow' && newKeyColors[tile.letter] !== 'green') newKeyColors[tile.letter] = 'yellow';
            else if (tile.state === 'gray' && newKeyColors[tile.letter] !== 'green' && newKeyColors[tile.letter] !== 'yellow') newKeyColors[tile.letter] = 'gray';
          });
        });
        
        setBoard(newBoard);
        setKeyColors(newKeyColors);
      };
      
      socket.on('spectator_update', handleSpectatorUpdate);
      return () => socket.off('spectator_update');
    }
  }, [isSpectator]);

  useEffect(() => {
    if (isSpectator) return;
    const handleKeyDown = (e) => {
      // If the user is typing into our hidden input (or any input), ignore it here to prevent double letters
      if (e.target.tagName === 'INPUT') return;
      
      if (isAnimating) return;
      if (e.key === 'Enter') handleKey('ENTER');
      else if (e.key === 'Backspace') handleKey('BACKSPACE');
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRow, currentCol, isAnimating, board, isSpectator]);

  const handleKey = async (key) => {
    if (isSpectator || isAnimating) return;

    if (key === 'ENTER') {
      if (currentCol !== 5) {
        shakeRow(currentRow);
        return;
      }
      await processGuess();
    } else if (key === 'BACKSPACE') {
      if (currentCol > 0) {
        const newBoard = [...board];
        newBoard[currentRow][currentCol - 1] = { letter: '', state: '', animate: '' };
        setBoard(newBoard);
        setCurrentCol(currentCol - 1);
      }
    } else {
      if (currentCol < 5) {
        const newBoard = [...board];
        newBoard[currentRow][currentCol] = { letter: key, state: '', animate: 'tile-pop' };
        setBoard(newBoard);
        setCurrentCol(currentCol + 1);
      }
    }
  };

  const shakeRow = (rowIdx) => {
    const newBoard = [...board];
    newBoard[rowIdx] = newBoard[rowIdx].map(t => ({ ...t, animate: '' }));
    setBoard(newBoard);
    setTimeout(() => {
      const shaken = [...board];
      shaken[rowIdx] = shaken[rowIdx].map(t => ({ ...t, animate: 'tile-shake' }));
      setBoard(shaken);
    }, 10);
  };

  const processGuess = async () => {
    setIsAnimating(true);
    const guessWord = board[currentRow].map(t => t.letter).join('');
    
    try {
      const data = await submitGuess(turnId, guessWord, currentRow + 1);
      
      const newBoard = [...board];
      const newKeyColors = { ...keyColors };
      const rowToBroadcast = [];
      
      // Animate flip one by one
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 200));
        const evalState = data.evaluation[i];
        newBoard[currentRow][i] = { ...newBoard[currentRow][i], animate: 'tile-flip' };
        setBoard([...newBoard]);
        
        setTimeout(() => {
          const boardAfterMidFlip = [...board];
          boardAfterMidFlip[currentRow][i].state = evalState;
          setBoard(boardAfterMidFlip);
          
          const letter = guessWord[i];
          if (evalState === 'green') newKeyColors[letter] = 'green';
          else if (evalState === 'yellow' && newKeyColors[letter] !== 'green') newKeyColors[letter] = 'yellow';
          else if (evalState === 'gray' && newKeyColors[letter] !== 'green' && newKeyColors[letter] !== 'yellow') newKeyColors[letter] = 'gray';
          setKeyColors({...newKeyColors});
        }, 300);
        
        rowToBroadcast.push({ letter: guessWord[i], state: evalState, animate: '' });
      }

      await new Promise(r => setTimeout(r, 800));

      // Emit to spectators
      if (socket.connected) {
        socket.emit('guess_submitted_multiplayer', rowToBroadcast);
      }

      if (data.is_solved || currentRow === 5) {
        onTurnEnd(data);
      } else {
        setCurrentRow(currentRow + 1);
        setCurrentCol(0);
        setIsAnimating(false);
      }
    } catch (err) {
      console.error(err);
      setIsAnimating(false);
    }
  };

  const getBgColor = (state) => {
    if (state === 'green') return 'bg-wordle-green border-wordle-green';
    if (state === 'yellow') return 'bg-wordle-yellow border-wordle-yellow';
    if (state === 'gray') return 'bg-wordle-gray border-wordle-gray';
    return 'bg-transparent border-wordle-border';
  };

  const inputRef = useRef(null);

  // Focus the hidden input to bring up the mobile keyboard
  useEffect(() => {
    if (!isSpectator) {
      // Small timeout to ensure rendering is complete before focusing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isSpectator, currentRow, isAnimating]);

  const handleMobileInput = (e) => {
    const val = e.target.value;
    
    // If length is less than 1, it means they pressed Backspace and deleted our dummy space!
    if (val.length < 1) {
      handleKey('BACKSPACE');
    } else if (val.length > 1) {
      // They typed a new character (dummy space is index 0)
      const char = val.slice(-1).toUpperCase();
      if (/^[A-Z]$/.test(char)) {
        handleKey(char);
      } else if (char === '\n' || e.nativeEvent.inputType === 'insertLineBreak') {
         // Some keyboards send line break for Enter
         handleKey('ENTER');
      }
    }
    
    // Reset to exactly one dummy space so backspace always works
    e.target.value = ' ';
  };

  const handleMobileKeyDown = (e) => {
    if (e.key === 'Backspace' && e.target.value === ' ') {
      // Some keyboards DO send Backspace properly, catch it here just in case
      handleKey('BACKSPACE');
      e.preventDefault();
    } else if (e.key === 'Enter') {
      handleKey('ENTER');
    }
  };

  return (
    <div 
      className="w-full flex-grow flex flex-col justify-between items-center h-full pb-2"
      onClick={() => inputRef.current?.focus()} // Refocus when tapping anywhere
    >
      {!isSpectator && (
        <input 
          ref={inputRef}
          type="text"
          defaultValue=" "
          className="absolute opacity-0 pointer-events-none w-0 h-0"
          onChange={handleMobileInput}
          onKeyDown={handleMobileKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck="false"
        />
      )}

      {isSpectator && (
        <div className="w-full text-center py-2 bg-gray-900 border border-wordle-border rounded-lg mb-2">
          <p className="font-bold text-gray-300">Spectating <span className="text-wordle-highlight">{guesserName}</span>...</p>
        </div>
      )}
      
      <div className="flex-1 flex justify-center items-center w-full min-h-0 py-2">
        <div className="grid grid-rows-6 gap-1 w-full max-w-[320px] max-h-[360px] aspect-[5/6]">
          {board.map((row, r) => (
            <div key={r} className="grid grid-cols-5 gap-1 h-full">
              {row.map((tile, c) => (
                <div 
                  key={c} 
                  className={`flex justify-center items-center text-2xl sm:text-3xl font-bold uppercase border-2 h-full w-full max-h-[60px] aspect-square
                    ${getBgColor(tile.state)}
                    ${tile.letter && !tile.state ? 'border-[#818384]' : ''}
                    ${tile.animate}
                  `}
                >
                  {tile.letter}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {!isSpectator && (
        <div className="w-full">
          <Keyboard onKeyPress={handleKey} keyColors={keyColors} />
        </div>
      )}
    </div>
  );
}

export default GameBoard;
