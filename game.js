// Each puzzle is a vertical addition where every picture stands for a digit.
// `rows` are the addends, `result` is the sum; items are keys into SYMBOLS.
const SYMBOLS = {
  hand: '✋', pizza: '🍕', apple: '🍏',
  ball: '🏐', heart: '❤️',
  bee: '🐝', ice: '🍦',
  straw: '🍓', cake: '🧁', star: '⭐',
};

const PUZZLES = [
  { rows: [['hand', 'hand'], ['pizza']], result: ['pizza', 'apple', 'apple'] },
  { rows: [['ball'], ['ball'], ['ball']], result: ['heart', 'ball'] },
  { rows: [['bee', 'ice'], ['heart', 'ice']], result: ['ice', 'ice', 'bee'] },
  { rows: [['straw', 'cake'], ['straw', 'cake']], result: ['star', 'cake', 'cake'] },
];

const $ = (id) => document.getElementById(id);
const state = { index: 0, assign: {}, selected: null, solved: new Set() };

const puzzle = () => PUZZLES[state.index];
const symbolsOf = (p) => [...new Set([...p.rows.flat(), ...p.result])];

function render() {
  const p = puzzle();
  const card = $('card');
  card.innerHTML = '';

  const cell = (key) => {
    const b = document.createElement('button');
    b.className = 'cell';
    b.dataset.key = key;
    const d = state.assign[key];
    b.innerHTML = `<span class="pic">${SYMBOLS[key]}</span><span class="digit">${d ?? ''}</span>`;
    if (state.selected === key) b.classList.add('selected');
    b.onclick = () => { state.selected = key; setMessage(''); render(); };
    return b;
  };

  const line = (keys, plus) => {
    const row = document.createElement('div');
    row.className = 'row';
    const sign = document.createElement('span');
    sign.className = 'plus';
    sign.textContent = plus ? '+' : '';
    row.append(sign, ...keys.map(cell));
    return row;
  };

  p.rows.forEach((r, i) => card.append(line(r, i > 0)));
  const rule = document.createElement('hr');
  card.append(rule, line(p.result, false));

  // number pad
  const pad = $('pad');
  pad.innerHTML = '';
  const used = new Set(Object.entries(state.assign).filter(([k]) => k !== state.selected).map(([, v]) => v));
  for (let n = 0; n <= 9; n++) {
    const b = document.createElement('button');
    b.textContent = n;
    b.disabled = state.selected === null;
    if (used.has(n)) b.classList.add('used');
    b.onclick = () => assignDigit(n);
    pad.append(b);
  }

  // progress dots
  const nav = $('progress');
  nav.innerHTML = '';
  PUZZLES.forEach((_, i) => {
    const b = document.createElement('button');
    b.textContent = i + 1;
    if (i === state.index) b.classList.add('current');
    if (state.solved.has(i)) b.classList.add('done');
    b.onclick = () => go(i);
    nav.append(b);
  });
}

function assignDigit(n) {
  const key = state.selected;
  if (key === null) return;
  // a digit can belong to only one picture: steal it from any other
  for (const k of Object.keys(state.assign)) if (state.assign[k] === n) delete state.assign[k];
  state.assign[key] = n;
  // move on to the next unassigned picture
  const next = symbolsOf(puzzle()).find((k) => state.assign[k] === undefined);
  state.selected = next ?? null;
  render();
}

const toNumber = (keys) => Number(keys.map((k) => state.assign[k]).join(''));

function check() {
  const p = puzzle();
  if (symbolsOf(p).some((k) => state.assign[k] === undefined)) {
    return setMessage('עוד לא נתתם ספרה לכל התמונות 🙂');
  }
  const sum = p.rows.reduce((acc, r) => acc + toNumber(r), 0);
  if (sum === toNumber(p.result)) {
    state.solved.add(state.index);
    setMessage('🎉 כל הכבוד! הצלחתם!', 'ok');
    render();
    if (state.index < PUZZLES.length - 1) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'primary';
      nextBtn.textContent = 'לתרגיל הבא ←';
      nextBtn.onclick = () => go(state.index + 1);
      $('message').append(' ', nextBtn);
    } else if (state.solved.size === PUZZLES.length) {
      $('message').append(' פתרתם את כל התרגילים! 🏆');
    }
  } else {
    setMessage('לא בדיוק, נסו שוב 💪', 'bad');
  }
}

function setMessage(text, kind = '') {
  const m = $('message');
  m.textContent = text;
  m.className = 'message ' + kind;
}

function go(i) {
  state.index = i;
  state.assign = {};
  state.selected = symbolsOf(puzzle())[0];
  setMessage('');
  render();
}

$('check').onclick = check;
$('clear').onclick = () => go(state.index);
go(0);
