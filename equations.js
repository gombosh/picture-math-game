// Picture equations: every picture is a hidden number. Work them out and
// answer the last line (the one that ends with "?").
// A line is { e: [tokens...], t: total } where t === null marks the question.
const OPS = ['+', '−', '×'];

const PUZZLES = [
  { lines: [
    { e: ['🐶', '+', '🐶'], t: 12 },
    { e: ['🐶', '+', '🐱'], t: 9 },
    { e: ['🐱', '+', '🐶', '+', '🐶'], t: null },
  ] },
  { lines: [
    { e: ['🍓', '+', '🍓', '+', '🍓'], t: 21 },
    { e: ['🍓', '+', '🍇', '+', '🍇'], t: 19 },
    { e: ['🍇', '−', '🍒'], t: 4 },
    { e: ['🍒', '+', '🍓', '+', '🍇'], t: null },
  ] },
  { lines: [
    { e: ['⚽', '+', '⚽'], t: 16 },
    { e: ['⚽', '+', '🏀'], t: 11 },
    { e: ['🏀', '×', '🎾'], t: 21 },
    { e: ['⚽', '+', '🎾', '+', '🏀'], t: null },
  ] },
  { lines: [
    { e: ['🐔', '+', '🐔', '+', '🐔'], t: 15 },
    { e: ['🐔', '+', '🐦'], t: 9 },
    { e: ['🦉', '+', '🐦', '+', '🐦'], t: 16 },
    { e: ['🐔', '+', '🐦', '+', '🦉'], t: null },
  ] },
  { lines: [
    { e: ['🚀', '+', '🚀', '+', '🚀'], t: 27 },
    { e: ['🚀', '+', '⭐', '+', '⭐'], t: 17 },
    { e: ['⭐', '×', '🌙'], t: 12 },
    { e: ['🚀', '×', '🌙', '−', '⭐'], t: null },
  ] },
  { lines: [
    { e: ['🍪', '+', '🍪', '+', '🍪', '+', '🍪'], t: 40 },
    { e: ['🍪', '−', '🐝'], t: 7 },
    { e: ['🐝', '×', '🦋'], t: 18 },
    { e: ['🦋', '×', '🍪', '−', '🐝'], t: null },
  ] },
];

// ---- maths -----------------------------------------------------------
const symbolsIn = (lines) => [...new Set(lines.flatMap((l) => l.e).filter((x) => !OPS.includes(x)))];

function evalLine(e, vals) {
  // × binds tighter than + and −
  const terms = [[vals[e[0]]]];
  const signs = [1];
  for (let i = 1; i < e.length; i += 2) {
    const v = vals[e[i + 1]];
    if (e[i] === '×') terms[terms.length - 1].push(v);
    else { terms.push([v]); signs.push(e[i] === '+' ? 1 : -1); }
  }
  return terms.reduce((sum, t, i) => sum + signs[i] * t.reduce((a, b) => a * b, 1), 0);
}

// Find every assignment of 1..30 that satisfies the known lines.
function solve(lines, max = 30) {
  const syms = symbolsIn(lines);
  const known = lines.filter((l) => l.t !== null);
  const sols = [];
  const vals = {};
  (function rec(i) {
    if (i === syms.length) {
      if (known.every((l) => evalLine(l.e, vals) === l.t)) sols.push({ ...vals });
      return;
    }
    for (let v = 1; v <= max; v++) { vals[syms[i]] = v; rec(i + 1); }
  })(0);
  return sols;
}

if (typeof document === 'undefined') {
  // run with node to sanity-check the puzzles
  PUZZLES.forEach((p, i) => {
    const sols = solve(p.lines);
    const q = p.lines.find((l) => l.t === null);
    console.log(i + 1, 'solutions:', sols.length, JSON.stringify(sols[0]), 'answer:', evalLine(q.e, sols[0]));
  });
} else {
  // ---- game ------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const state = { index: 0, answer: '', solved: new Set(), hints: 0, values: null };
  const puzzle = () => PUZZLES[state.index];

  function render() {
    const p = puzzle();
    const card = $('card');
    card.innerHTML = '';
    p.lines.forEach((l) => {
      const row = document.createElement('div');
      row.className = 'eq' + (l.t === null ? ' question' : '');
      l.e.forEach((tok) => {
        const s = document.createElement('span');
        s.className = OPS.includes(tok) ? 'op' : 'pic';
        s.textContent = tok;
        row.append(s);
      });
      const eq = document.createElement('span');
      eq.className = 'op';
      eq.textContent = '=';
      const tot = document.createElement('span');
      tot.className = 'total';
      tot.textContent = l.t === null ? (state.answer || '?') : l.t;
      row.append(eq, tot);
      card.append(row);
    });

    // hints: reveal values one picture at a time
    const hint = $('hints');
    hint.innerHTML = '';
    const syms = symbolsIn(p.lines);
    syms.slice(0, state.hints).forEach((s) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = `${s} = ${state.values[s]}`;
      hint.append(chip);
    });

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

    const pad = $('pad');
    pad.innerHTML = '';
    pad.hidden = state.solved.has(state.index);
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, '⌫'].forEach((k) => {
      const b = document.createElement('button');
      b.textContent = k;
      if (k === '⌫') b.className = 'del';
      b.onclick = () => key(k);
      pad.append(b);
    });
  }

  function key(k) {
    setMessage('');
    if (k === '⌫') state.answer = state.answer.slice(0, -1);
    else if (state.answer.length < 3) state.answer += k;
    render();
  }

  function check() {
    if (!state.answer) return setMessage('כתבו קודם תשובה 🙂');
    const p = puzzle();
    const q = p.lines.find((l) => l.t === null);
    if (Number(state.answer) === evalLine(q.e, state.values)) {
      state.solved.add(state.index);
      state.hints = symbolsIn(p.lines).length; // show every value
      setMessage('🎉 כל הכבוד! תשובה נכונה!', 'ok');
      render();
      if (state.index < PUZZLES.length - 1) {
        const nb = document.createElement('button');
        nb.className = 'primary';
        nb.textContent = 'לחידה הבאה ←';
        nb.onclick = () => go(state.index + 1);
        $('message').append(' ', nb);
      } else if (state.solved.size === PUZZLES.length) {
        $('message').append(' פתרתם את כולן! 🏆');
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
    state.answer = '';
    state.hints = 0;
    state.values = solve(puzzle().lines)[0];
    setMessage('');
    render();
  }

  $('check').onclick = check;
  $('hint').onclick = () => { state.hints = Math.min(state.hints + 1, symbolsIn(puzzle().lines).length); render(); };
  $('clear').onclick = () => go(state.index);
  document.addEventListener('keydown', (e) => {
    if (/^[0-9]$/.test(e.key)) key(e.key);
    else if (e.key === 'Backspace') key('⌫');
    else if (e.key === 'Enter') check();
  });
  go(0);
}
