const NEXT_PAGE = "strands.html";
const MAX_MISTAKES = 4;

// difficulty order: 0 = yellow (easiest) ... 3 = purple (hardest)
const CATEGORIES = [
  {
    title: "TYPES OF ___ GAMES",
    color: "cn-yellow",
    words: ["MIND", "ARCADE", "IMESSAGE", "BRAIN"]
  },
  {
    title: 'WORDS THAT CAN FOLLOW "DEEP"',
    color: "cn-green",
    words: ["DIVE", "SLEEP", "THOUGHT", "DOWN"]
  },
  {
    title: "SONGS THAT COME WITH CONTEXT",
    color: "cn-blue",
    words: ["WONDER", "CITY TOO COLD", "ATTITUDE", "SEASONS"]
  },
  {
    title: "GAMES FLORA NEEDS PRACTISE ON!",
    color: "cn-purple",
    words: ["PUNCHING BAG", "TABLE TENNIS", "MANCALA", "MONKEYTYPE"]
  }
];

const gridEl = document.getElementById("cnGrid");
const solvedBoardEl = document.getElementById("cnSolved");
const messageEl = document.getElementById("cnMessage");
const dotsEl = document.getElementById("cnDots");
const shuffleBtn = document.getElementById("cnShuffleBtn");
const deselectBtn = document.getElementById("cnDeselectBtn");
const submitBtn = document.getElementById("cnSubmitBtn");
const menuBtn = document.getElementById("menuBtn");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const closeModal = document.getElementById("closeModal");

let tiles = [];
let selected = [];
let solvedCats = [];
let mistakesUsed = 0;
let gameOver = false;

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTiles() {
  let all = [];
  CATEGORIES.forEach((cat, idx) => {
    cat.words.forEach(w => all.push({ word: w, catIndex: idx }));
  });
  return shuffleArray(all);
}

function setMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = "wl-message" + (type ? ` cn-message-${type}` : "");
}

function renderDots() {
  dotsEl.innerHTML = "";
  for (let i = 0; i < MAX_MISTAKES; i++) {
    const d = document.createElement("span");
    d.className = "cn-dot" + (i < mistakesUsed ? " cn-dot-used" : "");
    dotsEl.appendChild(d);
  }
}

function renderGrid() {
  gridEl.innerHTML = "";
  tiles.forEach(t => {
    if (solvedCats.includes(t.catIndex)) return;
    const btn = document.createElement("button");
    btn.className = "cn-tile";
    btn.textContent = t.word;
    btn.dataset.word = t.word;
    if (selected.includes(t.word)) btn.classList.add("cn-tile-selected");
    btn.addEventListener("click", () => toggleSelect(t.word));
    gridEl.appendChild(btn);
    t.el = btn;
  });
}

function renderSolvedBoard() {
  solvedBoardEl.innerHTML = "";
  solvedCats.forEach(idx => {
    const cat = CATEGORIES[idx];
    const row = document.createElement("div");
    row.className = `cn-solved-row ${cat.color}`;
    row.innerHTML = `<div class="cn-solved-title">${cat.title}</div><div class="cn-solved-words">${cat.words.join(", ")}</div>`;
    solvedBoardEl.appendChild(row);
  });
}

function toggleSelect(word) {
  if (gameOver) return;
  if (selected.includes(word)) {
    selected = selected.filter(w => w !== word);
  } else {
    if (selected.length >= 4) return;
    selected.push(word);
  }
  renderGrid();
  updateButtons();
}

function updateButtons() {
  submitBtn.disabled = selected.length !== 4;
  deselectBtn.disabled = selected.length === 0;
}

function checkSelection() {
  if (selected.length !== 4 || gameOver) return;
  const catIdx = tiles.find(t => t.word === selected[0]).catIndex;
  const allSameCat = selected.every(w => tiles.find(t => t.word === w).catIndex === catIdx);

  if (allSameCat) {
    solvedCats.push(catIdx);
    selected = [];
    setMessage("Nice one!", "ok");
    renderSolvedBoard();
    renderGrid();
    updateButtons();
    checkWin();
    return;
  }

  const counts = {};
  selected.forEach(w => {
    const ci = tiles.find(t => t.word === w).catIndex;
    counts[ci] = (counts[ci] || 0) + 1;
  });
  const oneOff = Object.values(counts).some(c => c === 3);

  mistakesUsed++;
  renderDots();

  selected.forEach(w => {
    const t = tiles.find(t => t.word === w);
    if (t.el) {
      t.el.classList.add("cn-tile-shake");
      setTimeout(() => t.el && t.el.classList.remove("cn-tile-shake"), 400);
    }
  });

  const remaining = MAX_MISTAKES - mistakesUsed;

  if (remaining <= 0) {
    endGame(false);
    return;
  } else if (oneOff) {
    setMessage("one off - lock in!!", "err");
  } else if (remaining === 1) {
    setMessage("cmon don't be an oompa loompa!", "err");
  } else {
    setMessage("hmm are you a dum dum?", "err");
  }
}

function checkWin() {
  if (solvedCats.length === CATEGORIES.length) {
    endGame(true);
  }
}

function endGame(won) {
  gameOver = true;
  selected = [];
  submitBtn.disabled = true;
  deselectBtn.disabled = true;
  shuffleBtn.disabled = true;

  if (won) {
    setMessage("", "");
    setTimeout(() => {
      showForcedModal(
        "OK locked in !",
        "🔥",
        () => { window.location.href = NEXT_PAGE; }
      );
    }, 700);
  } else {
    setMessage("", "");
    CATEGORIES.forEach((cat, idx) => {
      if (solvedCats.includes(idx)) return;
      const row = document.createElement("div");
      row.className = `cn-solved-row ${cat.color}`;
      row.innerHTML = `<div class="cn-solved-title">${cat.title}</div><div class="cn-solved-words">${cat.words.join(", ")}</div>`;
      solvedBoardEl.appendChild(row);
    });
    gridEl.innerHTML = "";
    setTimeout(() => {
      showForcedModal(
        "the answers were right there",
        "moving on",
        () => { window.location.href = NEXT_PAGE; }
      );
    }, 900);
  }
}

function deselectAll() {
  selected = [];
  renderGrid();
  updateButtons();
}

function shuffleGrid() {
  const unsolved = tiles.filter(t => !solvedCats.includes(t.catIndex));
  const solved = tiles.filter(t => solvedCats.includes(t.catIndex));
  tiles = solved.concat(shuffleArray(unsolved));
  renderGrid();
}

submitBtn.addEventListener("click", () => {
  checkSelection();
});
deselectBtn.addEventListener("click", deselectAll);
shuffleBtn.addEventListener("click", shuffleGrid);

menuBtn.addEventListener("click", () => {
  modalContent.innerHTML = `
    <h2>How to play</h2>
    <p>Find groups of four words that share something in common.</p>
    <p>Select four tiles and hit submit. Categories range from straightforward (yellow) to tricky (purple).</p>
    <p>You've got ${MAX_MISTAKES} mistakes before it's game over.</p>
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

tiles = buildTiles();
renderGrid();
renderDots();
updateButtons();
