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
    // Focus the input so the native mobile keyboard pops up automatically
    inputRef.current?.focus();
  }, []);

  const handleKeyPress = (key) => {
    if (key === 'ENTER') {
      handleSubmit(new Event('submit'));
    } else if (key === 'BACKSPACE') {
      setWordInput(prev => prev.slice(0, -1));
    } else {
      if (word.length < 5) {
        setWordInput(prev => prev + key);
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (word.length !== 5) {
      setError('Word must be exactly 5 letters.');
      return;
    }
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

  return (
    <div className="w-full h-full flex flex-col justify-between items-center text-center pb-2">
      <div className="w-full flex-grow flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Set the Secret Word</h1>
        <p className="mb-8 text-gray-300">
          <span className="font-bold text-wordle-highlight">{setter?.name}</span>, enter a 5-letter word for <span className="font-bold">{guesser?.name}</span> to guess.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
          <div className="flex w-full max-w-[300px] mb-2">
            <input
              ref={inputRef}
              type={visible ? 'text' : 'password'}
              value={word}
              onChange={(e) => setWordInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5))}
              className="flex-grow p-4 text-center text-2xl font-bold bg-transparent border-2 border-wordle-border rounded-l focus:border-wordle-highlight outline-none tracking-[0.5em]"
              placeholder="5-LETTERS"
              autoComplete="off"
            />
            <button 
              type="button" 
              onClick={() => setVisible(!visible)}
              className="bg-wordle-border px-4 rounded-r hover:bg-gray-700 transition text-xl"
              title="Toggle Visibility"
            >
              {visible ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          
          <div className="h-6 mb-6 text-sm">
            {error && <p className="text-red-500">{error}</p>}
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="bg-wordle-green px-8 py-3 rounded text-lg font-bold hover:bg-green-600 active:scale-95 transition disabled:opacity-50"
          >
            {loading ? 'Validating...' : 'Set Word'}
          </button>
        </form>
      </div>

      <div className="w-full">
        <Keyboard onKeyPress={handleKeyPress} keyColors={{}} />
      </div>
    </div>
  );
}

export default SetWord;
