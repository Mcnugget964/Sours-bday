const GRID = [
  ["M","E","S","O","R","Y"],
  ["T","H","M","R","E","L"],
  ["I","N","T","U","T","T"],
  ["A","N","U","R","S","E"],
  ["P","F","Y","H","V","K"],
  ["M","R","C","L","I","N"],
  ["O","R","E","I","L","I"],
  ["C","A","E","W","T","H"]
];

const WORDS = ["THINK", "ARCHIVE", "COMPANY", "TRUTHS", "MEMORY", "FREEWILL", "LETSRUNIT"];

// Exact non-overlapping solution: all 48 grid letters are used exactly once.
// LETSRUNIT is the spangram and can be found at any time.
const VALID_PATHS = {
  THINK: [[7,4],[7,5],[6,5],[5,5],[4,5]],
  ARCHIVE: [[7,1],[6,1],[5,2],[4,3],[5,4],[4,4],[3,5]],
  COMPANY: [[7,0],[6,0],[5,0],[4,0],[3,0],[3,1],[4,2]],
  TRUTHS: [[2,4],[1,3],[2,3],[2,2],[1,1],[0,2]],
  MEMORY: [[0,0],[0,1],[1,2],[0,3],[0,4],[0,5]],
  FREEWILL: [[4,1],[5,1],[6,2],[7,2],[7,3],[6,3],[5,3],[6,4]],
  LETSRUNIT: [[1,5],[1,4],[2,5],[3,4],[3,3],[3,2],[2,1],[2,0],[1,0]]
};

const gridEl = document.getElementById("grid");
const lineLayer = document.getElementById("lineLayer");
const foundCountEl = document.getElementById("foundCount");
const hintCountEl = document.getElementById("hintCount");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

let selected = [];
let found = new Set();
let hints = 3;
let dragging = false;
let soundOn = true;
let pointerId = null;
let livePointer = null;

function key(r,c) { return `${r},${c}`; }

function adjacent(a,b) {
  const dr = Math.abs(a[0]-b[0]);
  const dc = Math.abs(a[1]-b[1]);
  return dr <= 1 && dc <= 1 && (dr + dc > 0);
}

function cellAt(r,c) {
  return gridEl.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
}

function makeGrid() {
  gridEl.innerHTML = "";
  GRID.forEach((row,r) => row.forEach((letter,c) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = letter;
    cell.dataset.row = r;
    cell.dataset.col = c;
    gridEl.appendChild(cell);
  }));
}

function boardPoint(r,c) {
  const board = document.querySelector(".board-wrap").getBoundingClientRect();
  const cell = cellAt(r,c).getBoundingClientRect();
  return {
    x: cell.left + cell.width/2 - board.left,
    y: cell.top + cell.height/2 - board.top
  };
}

function svgEl(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v));
  return el;
}

function drawPath(path, className) {
  const points = path.map(([r,c]) => boardPoint(r,c));
  const poly = svgEl("polyline", {
    points: points.map(p => `${p.x},${p.y}`).join(" "),
    class: className
  });
  lineLayer.appendChild(poly);
}

function drawFoundLines() {
  lineLayer.innerHTML = "";
  found.forEach(word => {
    drawPath(VALID_PATHS[word], word === "LETSRUNIT" ? "found-line-yellow" : "found-line-blue");
  });
}

function drawLiveLine() {
  // Keep the found paths underneath the active white drag line.
  drawFoundLines();
  if (!selected.length) return;

  const points = selected.map(([r,c]) => boardPoint(r,c));
  if (livePointer) points.push(livePointer);

  const poly = svgEl("polyline", {
    points: points.map(p => `${p.x},${p.y}`).join(" "),
    class: "drag-line"
  });
  lineLayer.appendChild(poly);
}

function clearSelection() {
  selected.forEach(([r,c]) => cellAt(r,c)?.classList.remove("selected"));
  selected = [];
  livePointer = null;
  drawFoundLines();
}

function addSelection(r,c) {
  if (selected.some(([sr,sc]) => sr===r && sc===c)) return;
  if (selected.length && !adjacent(selected[selected.length-1], [r,c])) return;
  selected.push([r,c]);
  cellAt(r,c)?.classList.add("selected");
  drawLiveLine();
}

function pointToCell(x,y) {
  return document.elementFromPoint(x,y)?.closest(".cell");
}

function selectedWord() {
  return selected.map(([r,c]) => GRID[r][c]).join("");
}

function samePath(a,b) {
  return a.length === b.length && a.every((p,i) => p[0]===b[i][0] && p[1]===b[i][1]);
}

function matchingWord() {
  const text = selectedWord();
  return WORDS.find(word => text === word && samePath(selected, VALID_PATHS[word]));
}

function playTone(ok = true) {
  if (!soundOn) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = ok ? 660 : 220;
    gain.gain.setValueAtTime(.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .12);
    osc.start();
    osc.stop(ctx.currentTime + .12);
  } catch (_) {}
}

function markFound(word) {
  found.add(word);
  foundCountEl.textContent = found.size;
  selected.forEach(([r,c]) => {
    const cell = cellAt(r,c);
    cell.classList.remove("selected");
    cell.classList.add(word === "LETSRUNIT" ? "found-yellow" : "found-blue");
  });
  selected = [];
  livePointer = null;
  drawFoundLines();
  playTone(true);

  if (word === "LETSRUNIT") {
    setTimeout(() => showModal(`
      <div class="complete">
        <div style="font-size:46px;color:var(--yellow)">✦</div>
        <h2>SPANGRAM FOUND!</h2>
        <p>You found the yellow one.</p>
        <button class="primary-btn" id="keepBtn">KEEP GOING</button>
      </div>
    `), 180);
    document.getElementById("keepBtn")?.addEventListener("click", closeModal);
  }

  if (found.size === WORDS.length) {
    setTimeout(showCompletion, 650);
  }
}

function finishDrag() {
  if (!dragging) return;
  dragging = false;
  livePointer = null;

  const word = matchingWord();
  if (word && !found.has(word)) {
    markFound(word);
  } else {
    playTone(false);
    clearSelection();
  }
}

gridEl.addEventListener("pointerdown", e => {
  const cell = e.target.closest(".cell");
  if (!cell) return;
  e.preventDefault();
  pointerId = e.pointerId;
  dragging = true;
  gridEl.setPointerCapture?.(pointerId);
  clearSelection();
  addSelection(+cell.dataset.row, +cell.dataset.col);
});

gridEl.addEventListener("pointermove", e => {
  if (!dragging || e.pointerId !== pointerId) return;
  e.preventDefault();

  livePointer = {
    x: e.clientX - document.querySelector(".board-wrap").getBoundingClientRect().left,
    y: e.clientY - document.querySelector(".board-wrap").getBoundingClientRect().top
  };

  const cell = pointToCell(e.clientX, e.clientY);
  if (cell) addSelection(+cell.dataset.row, +cell.dataset.col);
  drawLiveLine();
});

gridEl.addEventListener("pointerup", e => {
  if (e.pointerId === pointerId) finishDrag();
});

gridEl.addEventListener("pointercancel", () => {
  dragging = false;
  clearSelection();
});

window.addEventListener("resize", drawFoundLines);

function showModal(html) {
  modalContent.innerHTML = html;
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

document.getElementById("closeModal").onclick = closeModal;
modal.addEventListener("click", e => {
  if (e.target === modal) closeModal();
});

document.getElementById("howBtn").onclick = () => showModal(`
  <h2>How to play</h2>
  <p>Drag your finger across adjacent letters to spell a hidden word.</p>
  <p>Letters can connect horizontally, vertically, or diagonally.</p>
  <p>There are <strong>7 words</strong> hidden in the grid.</p>
  <p>You don't need to find them in any particular order.</p>
`);

document.getElementById("menuBtn").onclick = () => showModal(`
  <h2>🍋</h2>
  <p>Just a little brain game.</p>
  <p>Good luck, sour.</p>
`);

document.getElementById("soundBtn").onclick = e => {
  soundOn = !soundOn;
  e.currentTarget.textContent = soundOn ? "◖))" : "🔇";
};

document.getElementById("resetBtn").onclick = () => {
  found.clear();
  hints = 3;
  hintCountEl.textContent = hints;
  foundCountEl.textContent = "0";
  clearSelection();
  document.querySelectorAll(".cell").forEach(cell => {
    cell.classList.remove("found-blue","found-yellow","selected","hint");
  });
};

document.getElementById("hintBtn").onclick = () => {
  if (hints <= 0) return;
  const missing = WORDS.find(word => !found.has(word));
  if (!missing) return;

  hints--;
  hintCountEl.textContent = hints;

  VALID_PATHS[missing].slice(0,3).forEach(([r,c]) => {
    const cell = cellAt(r,c);
    cell.classList.add("hint");
    setTimeout(() => cell.classList.remove("hint"), 1800);
  });
};

function showCompletion() {
  showModal(`
    <div class="complete">
      <div style="font-size:52px;color:var(--yellow)">✦</div>
      <h2>Happy birthday Flora :)</h2>
    </div>
  `);
}

makeGrid();
drawFoundLines();
