const puzzle = document.getElementById("puzzle");
const photoInput = document.getElementById("photoInput");
const photoName = document.getElementById("photoName");
const timerElement = document.getElementById("timer");
const movesElement = document.getElementById("moves");
const scoreElement = document.getElementById("score");
const shuffleBtn = document.getElementById("shuffleBtn");
const restartBtn = document.getElementById("restartBtn");
const winMessage = document.getElementById("winMessage");
const finalTime = document.getElementById("finalTime");
const finalMoves = document.getElementById("finalMoves");
const finalScore = document.getElementById("finalScore");
const playAgainBtn = document.getElementById("playAgainBtn");

const GRID_SIZE = 3;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

let tiles = [];
let moves = 0;
let seconds = 0;
let timerInterval = null;
let gameStarted = false;
let draggedIndex = null;
let selectedTile = null;
let selectedImage = null;

function isImageFile(file) {
    return file && file.type.startsWith("image/");
}

photoInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
        alert("File yang dipilih harus berupa gambar.");
        photoInput.value = "";
        return;
    }

    photoName.textContent = file.name;

    const reader = new FileReader();
    reader.onload = (e) => {
        selectedImage = e.target.result;
        createNewPuzzle();
    };
    reader.onerror = () => alert("Gagal membaca foto. Silakan coba lagi.");
    reader.readAsDataURL(file);
});

function createNewPuzzle() {
    stopTimer();
    moves = 0;
    seconds = 0;
    gameStarted = false;
    selectedTile = null;
    draggedIndex = null;
    winMessage.classList.remove("show");

    tiles = Array.from({ length: TOTAL_TILES }, (_, index) => index);
    shufflePuzzle();
    updateInfo();
}

function renderPuzzle() {
    puzzle.innerHTML = "";

    tiles.forEach((tileNumber, position) => {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.draggable = true;
        tile.tabIndex = 0;
        tile.dataset.position = String(position);
        tile.dataset.number = String(tileNumber);
        tile.setAttribute("aria-label", `Potongan ${tileNumber + 1}`);

        if (selectedImage) {
            const row = Math.floor(tileNumber / GRID_SIZE);
            const column = tileNumber % GRID_SIZE;
            tile.style.backgroundImage = `url("${selectedImage}")`;
            tile.style.backgroundPosition = `${column * 50}% ${row * 50}%`;
        }

        tile.addEventListener("dragstart", handleDragStart);
        tile.addEventListener("dragover", handleDragOver);
        tile.addEventListener("drop", handleDrop);
        tile.addEventListener("dragend", handleDragEnd);
        tile.addEventListener("click", handleTileClick);
        tile.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleTileClick({ currentTarget: tile });
            }
        });

        puzzle.appendChild(tile);
    });
}

function handleDragStart(event) {
    draggedIndex = Number(event.currentTarget.dataset.position);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(draggedIndex));
    event.currentTarget.classList.add("dragging");
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
}

function handleDrop(event) {
    event.preventDefault();
    const targetIndex = Number(event.currentTarget.dataset.position);
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    swapTiles(draggedIndex, targetIndex);
    draggedIndex = null;
}

function handleDragEnd(event) {
    event.currentTarget.classList.remove("dragging");
    draggedIndex = null;
}

function handleTileClick(event) {
    const position = Number(event.currentTarget.dataset.position);

    if (selectedTile === null) {
        selectedTile = position;
        renderPuzzle();
        document.querySelector(`[data-position="${position}"]`)?.classList.add("selected");
        return;
    }

    if (selectedTile === position) {
        selectedTile = null;
        renderPuzzle();
        return;
    }

    const first = selectedTile;
    selectedTile = null;
    swapTiles(first, position);
}

function swapTiles(index1, index2) {
    if (index1 === index2) return;

    [tiles[index1], tiles[index2]] = [tiles[index2], tiles[index1]];
    moves += 1;
    startGame();
    updateInfo();
    renderPuzzle();
    checkWin();
}

function shufflePuzzle() {
    let attempts = 0;
    do {
        for (let i = tiles.length - 1; i > 0; i -= 1) {
            const random = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[random]] = [tiles[random], tiles[i]];
        }
        attempts += 1;
    } while (isSolved() && attempts < 20);

    renderPuzzle();
}

function isSolved() {
    return tiles.every((tile, index) => tile === index);
}

function checkWin() {
    if (!isSolved()) return;

    stopTimer();
    gameStarted = false;

    const score = calculateScore();
    finalTime.textContent = formatTime(seconds);
    finalMoves.textContent = String(moves);
    finalScore.textContent = String(score);
    scoreElement.textContent = String(score);
    winMessage.classList.add("show");
}

function calculateScore() {
    return Math.max(100, 1000 - (moves * 5) - Math.floor(seconds / 5));
}

function startGame() {
    if (gameStarted || !selectedImage || isSolved()) return;

    gameStarted = true;
    timerInterval = window.setInterval(() => {
        seconds += 1;
        timerElement.textContent = formatTime(seconds);
        scoreElement.textContent = String(calculateScore());
    }, 1000);
}

function stopTimer() {
    if (timerInterval !== null) {
        window.clearInterval(timerInterval);
        timerInterval = null;
    }
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function updateInfo() {
    movesElement.textContent = String(moves);
    timerElement.textContent = formatTime(seconds);
    scoreElement.textContent = String(calculateScore());
}

function requireImage() {
    if (selectedImage) return true;
    alert("Silakan pilih foto dari galeri terlebih dahulu.");
    return false;
}

shuffleBtn.addEventListener("click", () => {
    if (!requireImage()) return;

    stopTimer();
    moves = 0;
    seconds = 0;
    gameStarted = false;
    selectedTile = null;
    shufflePuzzle();
    updateInfo();
});

restartBtn.addEventListener("click", () => {
    if (!requireImage()) return;
    createNewPuzzle();
});

playAgainBtn.addEventListener("click", () => {
    if (!selectedImage) return;
    createNewPuzzle();
});

winMessage.addEventListener("click", (event) => {
    if (event.target === winMessage) {
        winMessage.classList.remove("show");
    }
});

window.addEventListener("beforeunload", stopTimer);

puzzle.innerHTML = `
    <div class="empty-puzzle">
        <div>📷</div>
        <div>Pilih foto dari galeri untuk memulai</div>
    </div>
`;
updateInfo();
