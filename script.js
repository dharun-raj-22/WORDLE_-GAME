const screens = {
    setup: document.getElementById('setup-screen'),
    handoffSetter: document.getElementById('handoff-setter-screen'),
    setWord: document.getElementById('set-word-screen'),
    handoffGuesser: document.getElementById('handoff-guesser-screen'),
    game: document.getElementById('game-screen')
};

const modals = {
    roundEnd: document.getElementById('round-end-modal'),
    gameOver: document.getElementById('game-over-modal')
};

let players = [];
let currentRound = 1;
const MAX_ROUNDS = 4;
let currentTurn = 0; // 0 to 3 within a round
let secretWord = "";
let guesses = [];
let currentGuess = "";
let gameActive = false;

// DOM Elements
const secretWordInput = document.getElementById('secret-word-input');
const board = document.getElementById('board');
const keyboard = document.getElementById('keyboard');

// Initialize
document.getElementById('btn-start-game').addEventListener('click', startGame);
document.getElementById('btn-im-setter').addEventListener('click', showSetWordScreen);
document.getElementById('btn-toggle-visibility').addEventListener('click', toggleWordVisibility);
document.getElementById('btn-set-word').addEventListener('click', submitSecretWord);
document.getElementById('btn-start-guessing').addEventListener('click', startGuessingPhase);
document.getElementById('btn-next-turn').addEventListener('click', nextTurn);
document.getElementById('btn-play-again').addEventListener('click', resetGame);

// Secret Word input enter key support
secretWordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        submitSecretWord();
    }
});

document.addEventListener('keydown', handlePhysicalKeyboard);

const keys = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','BACKSPACE']
];

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function startGame() {
    players = [
        { name: document.getElementById('p1-name').value.trim() || 'Player 1', score: 0 },
        { name: document.getElementById('p2-name').value.trim() || 'Player 2', score: 0 },
        { name: document.getElementById('p3-name').value.trim() || 'Player 3', score: 0 },
        { name: document.getElementById('p4-name').value.trim() || 'Player 4', score: 0 }
    ];
    currentRound = 1;
    currentTurn = 0;
    setupBoard();
    setupKeyboard();
    startTurn();
}

function getSetterGuesser() {
    const setter = players[currentTurn];
    const guesser = players[(currentTurn + 1) % 4];
    return { setter, guesser };
}

function startTurn() {
    const { setter, guesser } = getSetterGuesser();
    document.getElementById('hs-round').innerText = currentRound;
    document.getElementById('hs-setter').innerText = setter.name;
    document.getElementById('hs-setter-btn').innerText = setter.name;
    document.getElementById('hs-guesser').innerText = guesser.name;
    
    switchScreen('handoffSetter');
}

function showSetWordScreen() {
    const { setter, guesser } = getSetterGuesser();
    document.getElementById('sw-setter').innerText = setter.name;
    document.getElementById('sw-guesser').innerText = guesser.name;
    secretWordInput.value = '';
    secretWordInput.type = 'password';
    document.getElementById('sw-error').classList.add('hidden');
    switchScreen('setWord');
    setTimeout(() => secretWordInput.focus(), 100);
}

function toggleWordVisibility() {
    if (secretWordInput.type === 'password') {
        secretWordInput.type = 'text';
    } else {
        secretWordInput.type = 'password';
    }
}

function submitSecretWord() {
    const word = secretWordInput.value.trim().toUpperCase();
    if (/^[A-Z]{5}$/.test(word)) {
        secretWord = word;
        showHandoffGuesserScreen();
    } else {
        document.getElementById('sw-error').classList.remove('hidden');
    }
}

function showHandoffGuesserScreen() {
    const { guesser } = getSetterGuesser();
    document.getElementById('hg-guesser').innerText = guesser.name;
    switchScreen('handoffGuesser');
}

function startGuessingPhase() {
    const { setter, guesser } = getSetterGuesser();
    document.getElementById('game-round').innerText = currentRound;
    document.getElementById('game-setter').innerText = setter.name;
    document.getElementById('game-guesser').innerText = guesser.name;
    updateMiniLeaderboard();
    
    guesses = [];
    currentGuess = "";
    gameActive = true;
    
    resetBoard();
    resetKeyboard();
    switchScreen('game');
}

function updateMiniLeaderboard() {
    const lb = document.getElementById('leaderboard-mini');
    lb.innerHTML = '';
    players.forEach(p => {
        const div = document.createElement('div');
        div.className = 'lb-player';
        div.innerHTML = `<span class="lb-name">${p.name}</span><span class="lb-score">${p.score}</span>`;
        lb.appendChild(div);
    });
}

function setupBoard() {
    board.innerHTML = '';
    for (let r = 0; r < 6; r++) {
        const row = document.createElement('div');
        row.className = 'row';
        for (let c = 0; c < 5; c++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.id = `tile-${r}-${c}`;
            row.appendChild(tile);
        }
        board.appendChild(row);
    }
}

function resetBoard() {
    for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 5; c++) {
            const tile = document.getElementById(`tile-${r}-${c}`);
            tile.innerText = '';
            tile.className = 'tile';
            tile.style.backgroundColor = '';
            tile.style.borderColor = '';
        }
    }
}

function setupKeyboard() {
    keyboard.innerHTML = '';
    keys.forEach(rowKeys => {
        const row = document.createElement('div');
        row.className = 'kb-row';
        rowKeys.forEach(key => {
            const button = document.createElement('button');
            button.className = 'key';
            if (key === 'ENTER' || key === 'BACKSPACE') {
                button.classList.add('large');
            }
            button.innerText = key === 'BACKSPACE' ? '⌫' : key;
            button.id = `key-${key}`;
            button.addEventListener('click', () => handleKey(key));
            row.appendChild(button);
        });
        keyboard.appendChild(row);
    });
}

function resetKeyboard() {
    document.querySelectorAll('.key').forEach(key => {
        key.removeAttribute('data-state');
    });
}

function handlePhysicalKeyboard(e) {
    if (!gameActive) return;
    
    const key = e.key.toUpperCase();
    if (key === 'ENTER') {
        handleKey('ENTER');
    } else if (key === 'BACKSPACE') {
        handleKey('BACKSPACE');
    } else if (/^[A-Z]$/.test(key)) {
        handleKey(key);
    }
}

function handleKey(key) {
    if (!gameActive) return;

    if (key === 'ENTER') {
        if (currentGuess.length === 5) {
            submitGuess();
        } else {
            shakeRow(guesses.length);
        }
    } else if (key === 'BACKSPACE') {
        if (currentGuess.length > 0) {
            currentGuess = currentGuess.slice(0, -1);
            updateBoardRow();
        }
    } else if (currentGuess.length < 5) {
        currentGuess += key;
        updateBoardRow();
    }
}

function updateBoardRow() {
    const rowIdx = guesses.length;
    for (let i = 0; i < 5; i++) {
        const tile = document.getElementById(`tile-${rowIdx}-${i}`);
        tile.innerText = currentGuess[i] || '';
        if (currentGuess[i]) {
            tile.setAttribute('data-state', 'active');
        } else {
            tile.removeAttribute('data-state');
        }
        tile.classList.remove('shake');
    }
}

function shakeRow(rowIdx) {
    for (let i = 0; i < 5; i++) {
        const tile = document.getElementById(`tile-${rowIdx}-${i}`);
        tile.classList.remove('shake');
        void tile.offsetWidth; // trigger reflow
        tile.classList.add('shake');
    }
}

function submitGuess() {
    const guessWord = currentGuess;
    const rowIdx = guesses.length;
    
    gameActive = false; // block input while animating
    
    const evaluation = evaluateGuess(guessWord, secretWord);
    
    // Animate tiles
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const tile = document.getElementById(`tile-${rowIdx}-${i}`);
            tile.classList.add('flip');
            
            setTimeout(() => {
                // Change color mid-flip
                const color = evaluation[i] === 'green' ? 'var(--green-color)' :
                              evaluation[i] === 'yellow' ? 'var(--yellow-color)' : 'var(--gray-color)';
                tile.style.backgroundColor = color;
                tile.style.borderColor = color;
                
                updateKeyboardColor(guessWord[i], evaluation[i]);
            }, 300);
            
            // Last tile animation finished
            if (i === 4) {
                setTimeout(() => {
                    checkWinCondition(guessWord);
                }, 400);
            }
        }, i * 300);
    }
}

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

function updateKeyboardColor(letter, state) {
    const key = document.getElementById(`key-${letter}`);
    if (!key) return;
    
    const currentState = key.getAttribute('data-state');
    
    if (state === 'green') {
        key.setAttribute('data-state', 'correct');
    } else if (state === 'yellow' && currentState !== 'correct') {
        key.setAttribute('data-state', 'present');
    } else if (state === 'gray' && currentState !== 'correct' && currentState !== 'present') {
        key.setAttribute('data-state', 'absent');
    }
}

function checkWinCondition(guessWord) {
    guesses.push(guessWord);
    const { setter, guesser } = getSetterGuesser();
    
    if (guessWord === secretWord) {
        // Win
        const attempts = guesses.length;
        const points = 7 - attempts; // 1 attempt = 6, 6 attempts = 1
        guesser.score += points;
        endTurn(true, points, attempts);
    } else if (guesses.length === 6) {
        // Lose
        setter.score += 1; // bonus for setter
        endTurn(false, 0, 6);
    } else {
        // Continue
        currentGuess = "";
        gameActive = true;
    }
}

function endTurn(isWin, points, attempts) {
    const { setter, guesser } = getSetterGuesser();
    
    const title = document.getElementById('re-title');
    const msg = document.getElementById('re-message');
    const scores = document.getElementById('re-scores');
    
    if (isWin) {
        title.innerText = "Word Guessed!";
        msg.innerHTML = `${guesser.name} guessed the word <br><strong class="highlight">${secretWord}</strong><br> in ${attempts} try${attempts>1?'ies':''}!`;
        scores.innerHTML = `<p>${guesser.name} gets <strong>+${points} pts</strong></p>`;
    } else {
        title.innerText = "Out of Tries!";
        msg.innerHTML = `${guesser.name} failed to guess the word <br><strong class="highlight">${secretWord}</strong>.`;
        scores.innerHTML = `<p>${setter.name} gets a bonus <strong>+1 pt</strong></p>`;
    }
    
    updateMiniLeaderboard();
    modals.roundEnd.classList.remove('hidden');
}

function nextTurn() {
    modals.roundEnd.classList.add('hidden');
    
    currentTurn++;
    if (currentTurn >= 4) {
        currentTurn = 0;
        currentRound++;
    }
    
    if (currentRound > MAX_ROUNDS) {
        showGameOver();
    } else {
        startTurn();
    }
}

function showGameOver() {
    // Sort players by score descending
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    
    // Check for ties
    const winners = sortedPlayers.filter(p => p.score === winner.score);
    
    const title = document.getElementById('go-winner');
    if (winners.length > 1) {
        title.innerText = `It's a Tie between ${winners.map(w => w.name).join(' & ')}!`;
    } else {
        title.innerText = `${winner.name} Wins!`;
    }
    
    const lbContainer = document.getElementById('go-leaderboard');
    lbContainer.innerHTML = '';
    sortedPlayers.forEach((p, index) => {
        const isWinner = p.score === winner.score;
        lbContainer.innerHTML += `
            <div class="lb-entry ${isWinner ? 'winner' : ''}">
                <span>${index + 1}. ${p.name}</span>
                <span>${p.score} pts</span>
            </div>
        `;
    });
    
    modals.gameOver.classList.remove('hidden');
}

function resetGame() {
    modals.gameOver.classList.add('hidden');
    document.getElementById('p1-name').value = players[0].name;
    document.getElementById('p2-name').value = players[1].name;
    document.getElementById('p3-name').value = players[2].name;
    document.getElementById('p4-name').value = players[3].name;
    switchScreen('setup');
}
