# Pass & Play Wordle

A local 4-player pass-and-play Wordle-style game with a React (Vite) frontend, Node.js/Express backend, and PostgreSQL database.

## Prerequisites
To run this project on your machine, you must have the following installed:
- [Node.js](https://nodejs.org/) (v16+)
- [PostgreSQL](https://www.postgresql.org/) (v14+)

## Setup Instructions

### 1. Database Setup
1. Open your PostgreSQL terminal (or pgAdmin) and create the database:
   ```sql
   CREATE DATABASE wordle_db;
   ```
2. Ensure your PostgreSQL instance has a user `postgres` with the password `2489` running on port `5432`. *(Note: You can change these credentials in `backend/db.js` if your local setup is different).*

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
   *The backend will automatically create all necessary tables, seed the dictionary, and start running on `http://localhost:5000`.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
4. Open your browser and go to `http://localhost:5173` to start playing!

## How to Play
- Enter 4 player names.
- The game automatically rotates Turns & Rounds. 
- **Setter:** Enters a secret 5-letter word while the device is hidden.
- **Guesser:** Takes the device and tries to guess the word using standard Wordle mechanics (Green/Yellow/Gray).
- Points are awarded based on how fast the word is guessed. The setter gets a bonus point if the guesser fails!
