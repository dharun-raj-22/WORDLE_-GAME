import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
});

export const initPlayers = async (players) => {
  const { data } = await api.post('/players/init', { players });
  return data;
};

export const startGame = async () => {
  const { data } = await api.post('/games/start');
  return data;
};

export const validateWord = async (word) => {
  const { data } = await api.post('/dictionary/validate', { word });
  return data.valid;
};

export const setWord = async (gameId, setterId, guesserId, secretWord) => {
  const { data } = await api.post('/turns/set-word', {
    game_id: gameId,
    setter_id: setterId,
    guesser_id: guesserId,
    secret_word: secretWord,
  });
  return data;
};

export const submitGuess = async (turnId, guess, attemptNumber) => {
  const { data } = await api.post('/turns/submit-guess', {
    turn_id: turnId,
    guess,
    attempt_number: attemptNumber,
  });
  return data;
};

export const getLeaderboard = async () => {
  const { data } = await api.get('/leaderboard');
  return data;
};

export const getGameSummary = async (gameId) => {
  const { data } = await api.get(`/games/${gameId}/summary`);
  return data;
};
