import { useState, useRef, useEffect } from 'react';
import { validateWord, setWord } from '../api';
import Keyboard from './Keyboard';

function SetWord({ gameId, setter, guesser, onWordSet }) {
  const [word, setWordInput] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus the hidden input so the native mobile keyboard pops up automatically
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (loading) return;
      
      if (e.key === 'Enter') handleKeyPress('ENTER');
      else if (e.key === 'Backspace') handleKeyPress('BACKSPACE');
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [word, loading]);

  const handleMobileInput = (e) => {
    const val = e.target.value;
    
    if (val.length < 1) {
      handleKeyPress('BACKSPACE');
    } else if (val.length > 1) {
      const char = val.slice(-1).toUpperCase();
      if (/^[A-Z]$/.test(char)) {
        handleKeyPress(char);
      } else if (char === '\n' || e.nativeEvent.inputType === 'insertLineBreak') {
        handleKeyPress('ENTER');
      }
    }
    
    e.target.value = ' ';
  };

  const handleMobileKeyDown = (e) => {
    if (e.key === 'Backspace' && e.target.value === ' ') {
      handleKeyPress('BACKSPACE');
      e.preventDefault();
    } else if (e.key === 'Enter') {
      handleKeyPress('ENTER');
    }
  };

  const handleKeyPress = (key) => {
    if (key === 'ENTER') {
      if (word.length === 5) {
        handleSubmit(new Event('submit'));
      } else {
        setError('Word must be 5 letters.');
      }
    } else if (key === 'BACKSPACE') {
      setWordInput(prev => prev.slice(0, -1));
      setError('');
    } else {
      if (word.length < 5) {
        setWordInput(prev => prev + key);
        setError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (word.length !== 5) return;

    setLoading(true);
    try {
      const isValid = await validateWord(word);
      if (!isValid) {
        setError('Word not found in dictionary.');
        setLoading(false);
        return;
      }
      
      const turnData = await setWord(gameId, setter.id, guesser.id, word);
      onWordSet(word, turnData.id);
    } catch (err) {
      setError('Error setting word.');
    }
    setLoading(false);
  };

  // Create an array of 5 tiles for the UI
  const tiles = Array.from({ length: 5 }, (_, i) => word[i] || '');

  return (
    <div 
      className="w-full h-full flex flex-col justify-between items-center text-center pb-2"
      onClick={() => inputRef.current?.focus()} // Refocus when tapping anywhere
    >
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

      <div className="w-full flex-grow flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Set the Secret Word</h1>
        <p className="mb-6 text-gray-300">
          <span className="font-bold text-wordle-highlight">{setter?.name}</span>, set a word for <span className="font-bold">{guesser?.name}</span>.
        </p>
        
        <div className="flex flex-col items-center w-full max-w-[320px]">
          {/* Tile Grid */}
          <div className="grid grid-cols-5 gap-1 w-full aspect-[5/1] mb-4">
            {tiles.map((letter, i) => (
              <div 
                key={i} 
                className={`flex justify-center items-center text-3xl font-bold uppercase border-2 h-full w-full max-h-[60px] aspect-square
                  ${letter ? 'border-[#818384] text-white' : 'border-wordle-border'}
                  ${!visible && letter ? 'bg-[#818384]' : 'bg-transparent'}
                `}
              >
                {visible ? letter : (letter ? ' ' : '')}
              </div>
            ))}
          </div>

          <button 
            type="button" 
            onClick={() => setVisible(!visible)}
            className="mb-4 text-sm text-gray-400 hover:text-white flex items-center gap-2"
          >
            {visible ? '👁️ Hide Word' : '👁️‍🗨️ Show Word'}
          </button>
          
          <div className="h-6 mb-4 text-sm font-bold">
            {error && <p className="text-red-500">{error}</p>}
          </div>
          
          <button 
            onClick={() => handleKeyPress('ENTER')}
            disabled={loading || word.length !== 5}
            className="bg-wordle-green w-full py-3 rounded text-lg font-bold hover:bg-green-600 active:scale-95 transition disabled:opacity-50"
          >
            {loading ? 'Validating...' : 'Set Word'}
          </button>
        </div>
      </div>

      <div className="w-full">
        <Keyboard onKeyPress={handleKeyPress} keyColors={{}} />
      </div>
    </div>
  );
}

export default SetWord;
