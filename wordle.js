const SECRET = "HELLO";
const MAX_GUESSES = 6;
const WORD_LEN = SECRET.length;
const NEXT_PAGE = "connections.html";

const boardEl = document.getElementById("wlBoard");
const keyboardEl = document.getElementById("wlKeyboard");
const messageEl = document.getElementById("wlMessage");
const guessCountEl = document.getElementById("guessCount");
const menuBtn = document.getElementById("menuBtn");
const orbBtn = document.getElementById("orbBtn");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const closeModal = document.getElementById("closeModal");

let currentGuess = "";
let guesses = [];
let gameOver = false;
let gameStarted = false;

const KEY_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","BACK"]
];

function buildBoard() {
  boardEl.innerHTML = "";
  for (let r = 0; r < MAX_GUESSES; r++) {
    const row = document.createElement("div");
    row.className = "wl-row";
    row.id = `wl-row-${r}`;
    for (let c = 0; c < WORD_LEN; c++) {
      const tile = document.createElement("div");
      tile.className = "wl-tile";
      tile.id = `wl-tile-${r}-${c}`;
      row.appendChild(tile);
    }
    boardEl.appendChild(row);
  }
}

function buildKeyboard() {
  keyboardEl.innerHTML = "";
  KEY_ROWS.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "wl-key-row";
    row.forEach(key => {
      const btn = document.createElement("button");
      btn.className = "wl-key" + (key.length > 1 ? " wl-key-wide" : "");
      btn.textContent = key === "BACK" ? "⌫" : (key === "ENTER" ? "ENTER" : key);
      btn.dataset.key = key;
      btn.addEventListener("click", () => handleKey(key));
      rowEl.appendChild(btn);
    });
    keyboardEl.appendChild(rowEl);
  });
}

function setMessage(text) {
  messageEl.textContent = text;
}

function handleKey(key) {
  if (gameOver || !gameStarted) return;

  if (key === "BACK") {
    currentGuess = currentGuess.slice(0, -1);
    renderCurrentRow();
    return;
  }

  if (key === "ENTER") {
    submitGuess();
    return;
  }

  if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LEN) {
    currentGuess += key;
    renderCurrentRow();
  }
}

function renderCurrentRow() {
  const rowIndex = guesses.length;
  for (let c = 0; c < WORD_LEN; c++) {
    const tile = document.getElementById(`wl-tile-${rowIndex}-${c}`);
    tile.textContent = currentGuess[c] || "";
    tile.classList.toggle("wl-tile-filled", !!currentGuess[c]);
  }
}

function submitGuess() {
  if (currentGuess.length < WORD_LEN) {
    setMessage("Not enough letters");
    shakeRow(guesses.length);
    return;
  }

  if (currentGuess !== SECRET && !VALID_WORDS.has(currentGuess.toLowerCase())) {
    setMessage("Not in word list");
    shakeRow(guesses.length);
    return;
  }

  const rowIndex = guesses.length;
  const result = scoreGuess(currentGuess, SECRET);

  result.forEach((status, c) => {
    const tile = document.getElementById(`wl-tile-${rowIndex}-${c}`);
    tile.classList.add(`wl-tile-${status}`, "wl-tile-flip");
    tile.style.animationDelay = `${c * 90}ms`;
  });

  updateKeyboardColors(currentGuess, result);

  guesses.push(currentGuess);
  guessCountEl.textContent = guesses.length;

  const won = currentGuess === SECRET;
  const lost = !won && guesses.length >= MAX_GUESSES;

  if (won) {
    gameOver = true;
    setMessage("");
    setTimeout(() => {
      showForcedModal(
        "Light work for Sour !",
        "I know",
        () => { window.location.href = NEXT_PAGE; }
      );
    }, 900);
  } else if (lost) {
    gameOver = true;
    setMessage("");
    setTimeout(() => {
      showForcedModal(
        "embarrassing",
        "yeah i'm locked out",
        () => { window.location.href = NEXT_PAGE; }
      );
    }, 900);
  } else {
    setMessage("");
  }

  currentGuess = "";
}

function scoreGuess(guess, secret) {
  const result = new Array(WORD_LEN).fill("absent");
  const secretLetters = secret.split("");
  const guessLetters = guess.split("");
  const used = new Array(WORD_LEN).fill(false);

  for (let i = 0; i < WORD_LEN; i++) {
    if (guessLetters[i] === secretLetters[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }

  for (let i = 0; i < WORD_LEN; i++) {
    if (result[i] === "correct") continue;
    const idx = secretLetters.findIndex((l, j) => l === guessLetters[i] && !used[j]);
    if (idx !== -1) {
      result[i] = "present";
      used[idx] = true;
    }
  }

  return result;
}

function updateKeyboardColors(guess, result) {
  guess.split("").forEach((letter, i) => {
    const btn = keyboardEl.querySelector(`[data-key="${letter}"]`);
    if (!btn) return;
    const status = result[i];
    const rank = { absent: 0, present: 1, correct: 2 };
    const currentRank = btn.dataset.rank ? rank[btn.dataset.rank] : -1;
    if (rank[status] > currentRank) {
      btn.classList.remove("wl-key-absent", "wl-key-present", "wl-key-correct");
      btn.classList.add(`wl-key-${status}`);
      btn.dataset.rank = status;
    }
  });
}

function shakeRow(rowIndex) {
  const row = document.getElementById(`wl-row-${rowIndex}`);
  if (!row) return;
  row.classList.add("wl-row-shake");
  setTimeout(() => row.classList.remove("wl-row-shake"), 420);
}

document.addEventListener("keydown", (e) => {
  const key = e.key.toUpperCase();
  if (key === "BACKSPACE") { handleKey("BACK"); return; }
  if (key === "ENTER") { handleKey("ENTER"); return; }
  if (/^[A-Z]$/.test(key)) handleKey(key);
});

menuBtn.addEventListener("click", () => {
  modalContent.innerHTML = `
    <h2>How to play</h2>
    <p>Guess the 5-letter word in 6 tries.</p>
    <p>Green = right letter, right spot.<br>Yellow = right letter, wrong spot.<br>Gray = not in the word.</p>
    <p>Solve it to unlock the next puzzle 🍋</p>
    <button class="primary-btn" id="modalOk">Got it</button>
  `;
  closeModal.style.display = "";
  modal.dataset.dismissable = "true";
  modal.classList.remove("hidden");
  document.getElementById("modalOk").addEventListener("click", () => modal.classList.add("hidden"));
});

closeModal.addEventListener("click", () => {
  if (modal.dataset.dismissable === "true") modal.classList.add("hidden");
});
modal.addEventListener("click", (e) => {
  if (e.target === modal && modal.dataset.dismissable === "true") modal.classList.add("hidden");
});

orbBtn.addEventListener("click", () => {
  modalContent.innerHTML = `
    <h2>👀</h2>
    <p>didn't expect you to find this.. well, i will say it was fun having something to think about, and i really enjoyed making this</p>
    <button class="primary-btn" id="orbModalOk">:)</button>
  `;
  closeModal.style.display = "";
  modal.dataset.dismissable = "true";
  modal.classList.remove("hidden");
  document.getElementById("orbModalOk").addEventListener("click", () => modal.classList.add("hidden"));
});

function showForcedModal(title, buttonLabel, onClick) {
  modalContent.innerHTML = `
    <h2>${title}</h2>
    <button class="primary-btn" id="forcedModalBtn">${buttonLabel}</button>
  `;
  closeModal.style.display = "none";
  modal.dataset.dismissable = "false";
  modal.classList.remove("hidden");
  document.getElementById("forcedModalBtn").addEventListener("click", onClick);
}

function showGateModal() {
  modalContent.innerHTML = `
    <h2>Do you want to play some brain games?</h2>
    <div class="modal-btn-row">
      <button class="primary-btn" id="gateSureBtn">Sure</button>
      <button class="primary-btn secondary-btn" id="gateNoBtn">No :(</button>
    </div>
  `;
  closeModal.style.display = "none";
  modal.dataset.dismissable = "false";
  modal.classList.remove("hidden");

  document.getElementById("gateSureBtn").addEventListener("click", () => {
    modal.classList.add("hidden");
    gameStarted = true;
  });

  document.getElementById("gateNoBtn").addEventListener("click", () => {
    showForcedModal("don't be an oompa loompa!", "Fine, fine", () => {
      showGateModal();
    });
  });
}

buildBoard();
buildKeyboard();
showGateModal();
