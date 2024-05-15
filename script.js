// Constants and variables
const startButton = document.getElementById('start-button');
const gameArea = document.getElementById('game-area');
const gameImage = document.getElementById('game-image');
const buttonsArea = document.getElementById('buttons-area');
const aiButton = document.getElementById('ai-button');
const realButton = document.getElementById('real-button');
const feedbackText = document.getElementById('feedback-text');
const livesCount = document.getElementById('lives-count');
const scoreCount = document.getElementById('score-count');
const gameOverArea = document.getElementById('game-over-area');
const finalScore = document.getElementById('final-score');
const playerNameInput = document.getElementById('player-name');
const addScoreButton = document.getElementById('add-score-button');
const tryAgainButton = document.getElementById('try-again-button');
const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardUrl = 'leaderboard.json';

let score = 0;
let lives = 3;
let images = [];
let currentImage = null;
let correctAnswer = '';
let currentPlayerName = '';
let playerBeatGame = false;

// Load images
async function loadImages() {
    const aiImages = await fetchImageList('images/ai.json');
    const realImages = await fetchImageList('images/real.json');

    images = [
        ...aiImages.map(name => ({ name, answer: 'AI', path: `images/ai/${name}` })),
        ...realImages.map(name => ({ name, answer: 'Real', path: `images/real/${name}` }))
    ];
}

// Helper function to fetch image names from a JSON file
async function fetchImageList(jsonFile) {
    try {
        const response = await fetch(jsonFile);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error(`Error fetching image list from ${jsonFile}:`, error);
    }
    return [];
}

// Initialize the game
function initGame() {
    score = 0;
    lives = 3;
    playerBeatGame = false;
    updateScore();
    updateLives();
    feedbackText.textContent = '';
    feedbackText.className = '';
    startButton.classList.add('hidden');
    gameArea.classList.remove('hidden');
    gameImage.classList.remove('hidden');
    buttonsArea.classList.remove('hidden');
    gameOverArea.classList.add('hidden');
    addScoreButton.classList.add('hidden');
    playerNameInput.value = '';
    playerNameInput.classList.remove('hidden');
    loadNextImage();
}

// Load the next random image
function loadNextImage() {
    if (images.length === 0) {
        playerBeatGame = true;
        gameOver();
        return;
    }
    const randomIndex = Math.floor(Math.random() * images.length);
    currentImage = images.splice(randomIndex, 1)[0];
    gameImage.src = currentImage.path;
    correctAnswer = currentImage.answer;
}

// Handle answer
function handleAnswer(answer) {
    if (answer === correctAnswer) {
        score++;
        feedbackText.textContent = 'Correct!';
        feedbackText.className = 'correct';
    } else {
        lives--;
        feedbackText.textContent = 'Incorrect!';
        feedbackText.className = 'incorrect';
    }
    updateScore();
    updateLives();
    if (lives === 0) {
        gameOver();
    } else {
        loadNextImage();
    }
}

// Update score
function updateScore() {
    scoreCount.textContent = score;
}

// Update lives
function updateLives() {
    livesCount.textContent = lives;
}

// Handle game over
async function gameOver() {
    finalScore.textContent = score;
    buttonsArea.classList.add('hidden');
    gameImage.classList.add('hidden');
    gameOverArea.classList.remove('hidden');

    try {
        const response = await fetch(leaderboardUrl);
        const leaderboard = await response.json();
        const playerRank = calculatePlayerRank(leaderboard);

        feedbackText.textContent = playerRank > 10
            ? `You didn't make it to the leaderboard. Your rank: ${playerRank}`
            : '';

        displayLeaderboard(leaderboard.slice(0, 10));
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Calculate player's rank
function calculatePlayerRank(leaderboard) {
    const tempLeaderboard = leaderboard.slice();
    tempLeaderboard.push({ name: currentPlayerName, score, lives, beatGame: playerBeatGame });
    tempLeaderboard.sort((a, b) => b.score - a.score);
    return tempLeaderboard.findIndex(entry => entry.name === currentPlayerName && entry.score === score) + 1;
}

// Display leaderboard
function displayLeaderboard(leaderboard) {
    leaderboardList.innerHTML = '';
    leaderboard
        .sort((a, b) => b.score - a.score)
        .forEach((entry, index) => {
            const li = document.createElement('li');
            const star = entry.beatGame ? ' ★' : '';
            li.textContent = `${index + 1}. ${entry.name}: ${entry.score} pts, ${entry.lives} lives${star}`;
            if (entry.name === currentPlayerName && entry.score === score) {
                li.classList.add(playerBeatGame ? 'winner' : 'highlight');
            }
            leaderboardList.appendChild(li);
        });
}

// Add score
async function addScore() {
    currentPlayerName = playerNameInput.value.trim().substring(0, 50); // Limit to 50 characters
    if (!currentPlayerName) return;

    try {
        const response = await fetch(leaderboardUrl);
        let allScores = await response.json();

        allScores.push({ name: currentPlayerName, score, lives, beatGame: playerBeatGame });
        allScores.sort((a, b) => b.score - a.score);
        const playerRank = calculatePlayerRank(allScores);

        feedbackText.textContent = playerRank > 10
            ? `You didn't make it to the leaderboard. Your rank: ${playerRank}`
            : '';

        const leaderboard = allScores.slice(0, 10); // Keep only top 10 for display

        await fetch(leaderboardUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allScores, null, 2) // Save all scores
        });

        displayLeaderboard(leaderboard);
    } catch (error) {
        console.error('Error adding score:', error);
    }

    playerNameInput.value = '';
    addScoreButton.classList.add('hidden');
    playerNameInput.classList.add('hidden');
}

// Event listeners
startButton.addEventListener('click', () => {
    loadImages().then(initGame);
});
aiButton.addEventListener('click', () => handleAnswer('AI'));
realButton.addEventListener('click', () => handleAnswer('Real'));
addScoreButton.addEventListener('click', addScore);
tryAgainButton.addEventListener('click', () => location.reload());
playerNameInput.addEventListener('input', () => {
    addScoreButton.classList.toggle('hidden', !playerNameInput.value.trim());
    playerNameInput.classList.remove('hidden');
});

// Load initial leaderboard
loadLeaderboard();