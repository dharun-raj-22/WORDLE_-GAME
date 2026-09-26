const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres', // connect to default db
  password: '2489',
  port: 5432,
});

async function createDb() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL.");
    await client.query('CREATE DATABASE wordle_db;');
    console.log("wordle_db created successfully!");
  } catch (err) {
    if (err.code === '42P04') {
      console.log("wordle_db already exists.");
    } else {
      console.error("Error creating database:", err);
    }
  } finally {
    await client.end();
  }
}

createDb();
