// Code crosswords: every picture is a Hebrew letter (the code differs per puzzle).
// `grid` is drawn exactly as printed; '.' is empty, other chars are keys of PICS.
// Horizontal words read right-to-left, vertical ones top-to-bottom.
const PICS = {
  S: '🍓', C: '🧁', T: '⭐', L: '🍃', E: '👁️', H: '❤️', O: '👟', F: '🐠',
  D: '✋', I: '🍦', P: '🍕', A: '🍏', G: '🍇', K: '🌵', W: '🐾', B: '🏐',
};

const PUZZLES = [
  {
    topic: 'פירות וירקות',
    grid: [
      '....P...',
      '..KAGPH.',
      'I.W.G.E.',
      'S.A.FEEP',
      'IDC...B.',
    ],
    code: { P: 'ב', K: 'ח', A: 'י', G: 'ט', H: 'א', W: 'צ', C: 'ל', D: 'פ', I: 'ת', S: 'ו', F: 'ה', E: 'נ', B: 'ס' },
  },
  {
    topic: 'בעלי חיים',
    grid: [
      'SC...',
      'T....',
      'LE..F',
      '.L..D',
      '.HTOF',
    ],
    code: { S: 'ז', C: 'ע', T: 'א', L: 'ב', E: 'צ', H: 'י', O: 'נ', F: 'ס', D: 'ו' },
  },
  {
    topic: 'גיבורי על',
    grid: [
      'LSPHIB....',
      '...E.H.P..',
      '...G.W.I..',
      '...K.W.A..',
      '.....C.W.F',
      '.LSIIPCLII',
      '.....S...P',
      '.....L....',
    ],
    code: { L: 'נ', S: 'מ', P: 'ר', H: 'פ', I: 'ו', B: 'ס', E: 'ל', G: 'א', K: 'ש', W: 'י', A: 'ב', C: 'ד', F: 'ת' },
  },
  {
    topic: 'נסיכות דיסני',
    grid: [
      'W........',
      'HFCPF....',
      '...B..C..',
      '...I..A..',
      '..GSFIT..',
      '...D..C..',
      '..GHPLSCA',
    ],
    code: { W: 'ב', H: 'ל', F: 'א', C: 'י', P: 'ר', B: 'פ', I: 'ו', S: 'נ', D: 'ז', T: 'מ', G: 'ה', A: 'ס', L: 'ד' },
  },
];

const LETTERS = [...'אבגדהוזחטיכלמנסעפצקרשת'];
const FINAL = { כ: 'ך', מ: 'ם', נ: 'ן', פ: 'ף', צ: 'ץ' };
const BASE = Object.fromEntries(Object.entries(FINAL).map(([b, f]) => [f, b]));

const $ = (id) => document.getElementById(id);
const state = { index: 0, guess: {}, selected: null, solved: new Set(), wrong: new Set() };

const puzzle = () => PUZZLES[state.index];
const keysOf = (p) => Object.keys(p.code);

// Does a word end at (r, c)? Used to show final letter forms (ם ן ך ף ץ).
function endsWord(grid, r, c) {
  const at = (rr, cc) => (grid[rr]?.[cc] ?? '.') !== '.';
  const horiz = at(r, c + 1) && !at(r, c - 1);
  const vert = at(r - 1, c) && !at(r + 1, c);
  return horiz || vert;
}

function render() {
  const p = puzzle();
  $('topic').textContent = p.topic;

  const cw = $('crossword');
  cw.innerHTML = '';
  cw.style.setProperty('--cols', p.grid[0].length);
  p.grid.forEach((row, r) => [...row].forEach((ch, c) => {
    const cell = document.createElement(ch === '.' ? 'span' : 'button');
    cell.className = 'xcell' + (ch === '.' ? ' empty' : '');
    if (ch !== '.') {
      const g = state.guess[ch];
      const shown = g && endsWord(p.grid, r, c) ? (FINAL[g] ?? g) : g;
      cell.innerHTML = `<span class="pic">${PICS[ch]}</span><span class="letter">${shown ?? ''}</span>`;
      if (state.selected === ch) cell.classList.add('selected');
      if (state.wrong.has(ch)) cell.classList.add('wrong');
      cell.onclick = () => select(ch);
    }
    cw.append(cell);
  }));

  const keys = $('keys');
  keys.innerHTML = '';
  const used = new Set(Object.entries(state.guess).filter(([k]) => k !== state.selected).map(([, v]) => v));
  LETTERS.forEach((l) => {
    const b = document.createElement('button');
    b.textContent = l;
    b.disabled = state.selected === null;
    if (used.has(l)) b.classList.add('used');
    b.onclick = () => assign(l);
    keys.append(b);
  });
  const del = document.createElement('button');
  del.textContent = '⌫';
  del.className = 'del';
  del.disabled = state.selected === null;
  del.onclick = () => { delete state.guess[state.selected]; state.wrong.clear(); render(); };
  keys.append(del);

  const nav = $('progress');
  nav.innerHTML = '';
  PUZZLES.forEach((q, i) => {
    const b = document.createElement('button');
    b.textContent = i + 1;
    b.title = q.topic;
    if (i === state.index) b.classList.add('current');
    if (state.solved.has(i)) b.classList.add('done');
    b.onclick = () => go(i);
    nav.append(b);
  });
}

function select(key) {
  state.selected = key;
  setMessage('');
  render();
}

function assign(letter) {
  const key = state.selected;
  if (key === null) return;
  letter = BASE[letter] ?? letter;
  // one letter per picture: take it away from any other picture
  for (const k of Object.keys(state.guess)) if (state.guess[k] === letter) delete state.guess[k];
  state.guess[key] = letter;
  state.wrong.clear();
  const next = keysOf(puzzle()).find((k) => state.guess[k] === undefined);
  state.selected = next ?? null;
  render();
}

function check() {
  const p = puzzle();
  const filled = keysOf(p).filter((k) => state.guess[k] !== undefined);
  state.wrong = new Set(filled.filter((k) => state.guess[k] !== p.code[k]));
  if (filled.length < keysOf(p).length) {
    setMessage(state.wrong.size ? 'יש טעויות (באדום), ועוד לא מילאתם הכול' : 'עוד לא מילאתם את כל התמונות 🙂', 'bad');
  } else if (state.wrong.size) {
    setMessage('כמעט! האותיות האדומות שגויות 💪', 'bad');
  } else {
    state.solved.add(state.index);
    setMessage('🎉 כל הכבוד! פתרתם את התשבץ!', 'ok');
    if (state.index < PUZZLES.length - 1) {
      const nb = document.createElement('button');
      nb.className = 'primary';
      nb.textContent = 'לתשבץ הבא ←';
      nb.onclick = () => go(state.index + 1);
      $('message').append(' ', nb);
    } else if (state.solved.size === PUZZLES.length) {
      $('message').append(' פתרתם את כולם! 🏆');
    }
  }
  render();
}

function reveal() {
  const p = puzzle();
  const key = state.selected ?? keysOf(p).find((k) => state.guess[k] !== p.code[k]);
  if (!key) return;
  for (const k of Object.keys(state.guess)) if (state.guess[k] === p.code[key] && k !== key) delete state.guess[k];
  state.guess[key] = p.code[key];
  state.wrong.clear();
  state.selected = keysOf(p).find((k) => state.guess[k] !== p.code[k]) ?? null;
  render();
}

function setMessage(text, kind = '') {
  const m = $('message');
  m.textContent = text;
  m.className = 'message ' + kind;
}

function go(i) {
  state.index = i;
  state.guess = {};
  state.wrong = new Set();
  state.selected = keysOf(puzzle())[0];
  setMessage('');
  render();
}

// physical Hebrew keyboard
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const l = BASE[e.key] ?? e.key;
  if (LETTERS.includes(l)) assign(l);
  else if (e.key === 'Backspace' && state.selected) { delete state.guess[state.selected]; state.wrong.clear(); render(); }
});

$('check').onclick = check;
$('reveal').onclick = reveal;
$('clear').onclick = () => go(state.index);
go(0);
