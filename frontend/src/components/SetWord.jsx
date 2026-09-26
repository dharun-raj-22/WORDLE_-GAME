import { useState, useRef, useEffect } from 'react';
import { validateWord, setWord } from '../api';

function SetWord({ gameId, setter, guesser, onWordSet }) {
  const [word, setWordInput] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="w-full text-center">
      <h1 className="text-3xl font-bold mb-4">Set the Secret Word</h1>
      <p className="mb-8 text-gray-300">
        <span className="font-bold text-wordle-highlight">{setter?.name}</span>, enter a 5-letter word for <span className="font-bold">{guesser?.name}</span> to guess.
      </p>
      
      <form onSubmit={handleSubmit} className="flex flex-col items-center">
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
  );
}

export default SetWord;
