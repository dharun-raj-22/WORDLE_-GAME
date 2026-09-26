const pool = require('./db');

const initDB = async () => {
  try {
    console.log("Checking and creating database tables if they don't exist...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        total_points INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        rounds_won INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS game_sessions (
        id SERIAL PRIMARY KEY,
        status VARCHAR(50) DEFAULT 'IN_PROGRESS',
        current_round INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS round_turns (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES game_sessions(id),
        setter_id INTEGER REFERENCES players(id),
        guesser_id INTEGER REFERENCES players(id),
        secret_word VARCHAR(5) NOT NULL,
        attempts_used INTEGER DEFAULT 0,
        is_solved BOOLEAN DEFAULT false,
        points_scored INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS dictionary (
        id SERIAL PRIMARY KEY,
        word VARCHAR(5) UNIQUE NOT NULL
      );
    `);

    // Seed dictionary with some valid 5-letter English words
    const seedWords = [
      'APPLE', 'BERRY', 'CRANE', 'DANCE', 'EAGLE', 'FLAME', 'GRAPE', 'HEART', 'IMAGE', 'JUICE',
      'KNIFE', 'LEMON', 'MANGO', 'NIGHT', 'OCEAN', 'PEACH', 'QUEEN', 'RIVER', 'SNAKE', 'TRAIN',
      'UNCLE', 'VOICE', 'WATER', 'XENON', 'YACHT', 'ZEBRA', 'HELLO', 'WORLD', 'GUESS', 'SCORE',
      'ROBOT', 'PLANT', 'GHOST', 'BREAD', 'CHAIR', 'HOUSE', 'LIGHT', 'MOUSE', 'PAPER', 'SUGAR',
      'TABLE', 'WATCH', 'YOUTH', 'TRUTH', 'PIZZA', 'MAGIC', 'HAPPY', 'SMILE', 'LAUGH', 'DREAM'
    ];
    
    // Insert seed words, ignoring if they already exist
    for (const word of seedWords) {
      await pool.query(
        'INSERT INTO dictionary (word) VALUES ($1) ON CONFLICT (word) DO NOTHING',
        [word]
      );
    }

    console.log("Database initialized and dictionary seeded successfully.");
  } catch (err) {
    console.error("Error initializing DB:", err);
    // If it's a connection error, you might want to terminate the process or just log it
  }
};

module.exports = initDB;
