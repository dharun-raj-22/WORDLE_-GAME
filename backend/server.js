const express = require('express');
const cors = require('cors');
const pool = require('./db');
const initDB = require('./init-db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Database on startup
initDB();

// Helper for Wordle guess evaluation
function evaluateGuess(guess, secret) {
    let result = Array(5).fill('gray');
    let secretArr = secret.split('');
    let guessArr = guess.split('');

    // First pass: Greens
    for (let i = 0; i < 5; i++) {
        if (guessArr[i] === secretArr[i]) {
            result[i] = 'green';
            secretArr[i] = null;
            guessArr[i] = null;
        }
    }

    // Second pass: Yellows
    for (let i = 0; i < 5; i++) {
        if (guessArr[i] !== null && secretArr.includes(guessArr[i])) {
            result[i] = 'yellow';
            secretArr[secretArr.indexOf(guessArr[i])] = null;
        }
    }
    return result;
}

// 1. POST /api/players/init -> Accept 4 player names, insert/update in DB, return IDs
app.post('/api/players/init', async (req, res) => {
  try {
    const { players } = req.body;
    if (!players || players.length !== 4) {
      return res.status(400).json({ error: "Requires exactly 4 player names" });
    }
    
    const results = [];
    for (const pName of players) {
      const result = await pool.query(
        'INSERT INTO players (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET games_played = players.games_played + 1 RETURNING id, name, total_points, games_played, rounds_won',
        [pName]
      );
      results.push(result.rows[0]);
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/games/start -> Create a new game session
app.post('/api/games/start', async (req, res) => {
  try {
    const result = await pool.query('INSERT INTO game_sessions (status, current_round) VALUES ($1, $2) RETURNING *', ['IN_PROGRESS', 1]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/dictionary/validate -> Check if word exists
app.post('/api/dictionary/validate', async (req, res) => {
  try {
    const { word } = req.body;
    if (!word) return res.status(400).json({ error: "Word is required" });

    // In a full production app, this would query a 10,000+ word dictionary DB.
    // For local Pass & Play, we'll allow any 5-letter combination so players aren't restricted by our small 50-word seed list.
    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/turns/set-word -> Save the masked secret word
app.post('/api/turns/set-word', async (req, res) => {
  try {
    const { game_id, setter_id, guesser_id, secret_word } = req.body;
    if (!game_id || !setter_id || !guesser_id || !secret_word) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      'INSERT INTO round_turns (game_id, setter_id, guesser_id, secret_word) VALUES ($1, $2, $3, $4) RETURNING *',
      [game_id, setter_id, guesser_id, secret_word.toUpperCase()]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/turns/submit-guess -> Evaluate guess
app.post('/api/turns/submit-guess', async (req, res) => {
  try {
    const { turn_id, guess, attempt_number } = req.body;
    if (!turn_id || !guess || !attempt_number) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Fetch turn
    const turnRes = await pool.query('SELECT * FROM round_turns WHERE id = $1', [turn_id]);
    if (turnRes.rows.length === 0) return res.status(404).json({ error: "Turn not found" });
    const turn = turnRes.rows[0];

    const guessWord = guess.toUpperCase();
    const evaluation = evaluateGuess(guessWord, turn.secret_word);
    const isSolved = guessWord === turn.secret_word;
    
    let points = 0;
    
    if (isSolved) {
      points = 7 - attempt_number;
      await pool.query('UPDATE round_turns SET is_solved=true, attempts_used=$1, points_scored=$2 WHERE id=$3', [attempt_number, points, turn_id]);
      await pool.query('UPDATE players SET total_points = total_points + $1, rounds_won = rounds_won + 1 WHERE id=$2', [points, turn.guesser_id]);
    } else if (attempt_number >= 6) {
      // Failed to guess within 6 attempts, setter gets 1 bonus point
      await pool.query('UPDATE round_turns SET is_solved=false, attempts_used=$1, points_scored=0 WHERE id=$2', [attempt_number, turn_id]);
      await pool.query('UPDATE players SET total_points = total_points + 1 WHERE id=$1', [turn.setter_id]);
    } else {
      // Update attempts, game continues
      await pool.query('UPDATE round_turns SET attempts_used=$1 WHERE id=$2', [attempt_number, turn_id]);
    }

    res.json({ evaluation, is_solved: isSolved, points_earned: points, attempts_used: attempt_number });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. GET /api/leaderboard -> Return rankings
app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, total_points, games_played, rounds_won FROM players ORDER BY total_points DESC, rounds_won DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. GET /api/games/:id/summary -> Game summary
app.get('/api/games/:id/summary', async (req, res) => {
  try {
    const { id } = req.params;
    const gameRes = await pool.query('SELECT * FROM game_sessions WHERE id = $1', [id]);
    if (gameRes.rows.length === 0) return res.status(404).json({ error: "Game not found" });
    
    const turnsRes = await pool.query(`
      SELECT t.*, s.name as setter_name, g.name as guesser_name 
      FROM round_turns t 
      JOIN players s ON t.setter_id = s.id 
      JOIN players g ON t.guesser_id = g.id 
      WHERE game_id = $1
      ORDER BY t.id ASC
    `, [id]);
    
    res.json({
      game: gameRes.rows[0],
      turns: turnsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
