const tabs = document.querySelectorAll('.tab');
const content = document.getElementById('content');
const KEY = 'heimtraining.overrides';

let base = {};       // exercises.json (Standard)
let pool = [];       // pool.json (alle 514 Übungen)
let overrides = {};  // {day: [übungen]} – nur editierte Tage
let day = 'push';
let picker = null;   // null = Tagesansicht, sonst {index} (index null = hinzufügen)

try { overrides = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { overrides = {}; }

Promise.all([
  fetch('exercises.json').then(r => r.json()),
  fetch('pool.json').then(r => r.json())
]).then(([b, p]) => { base = b; pool = p; render(); })
  .catch(err => { content.innerHTML = `<p class="error">Fehler beim Laden: ${err}</p>`; });

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const list = () => overrides[day] || base[day] || [];

function save(arr) {
  overrides[day] = arr;
  try { localStorage.setItem(KEY, JSON.stringify(overrides)); } catch (e) {}
}

function render() {
  if (picker) return renderPicker();
  const items = list();
  content.innerHTML = (items.length ? '' : `<p class="placeholder">Keine Übungen.</p>`) +
    items.map((ex, i) => `
    <div class="exercise">
      <img class="exercise-gif" src="${esc(ex.gif)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
      <div class="exercise-info">
        <div class="exercise-name">${esc(ex.name)}</div>
        <div class="exercise-muscle">${esc(ex.muscle)}</div>
      </div>
      <div class="exercise-actions">
        <button data-act="swap" data-i="${i}">Tauschen</button>
        <button data-act="del" data-i="${i}">Entfernen</button>
      </div>
    </div>`).join('') +
    `<div class="edit-bar">
      <button data-act="add">+ Übung hinzufügen</button>
      ${overrides[day] ? '<button data-act="reset">Tag auf Standard zurücksetzen</button>' : ''}
    </div>`;
}

function renderPicker() {
  content.innerHTML = `
    <div class="picker">
      <div class="picker-head">
        <input id="q" type="search" placeholder="Übung suchen…" autocomplete="off">
        <button data-act="cancel">Abbrechen</button>
      </div>
      <p class="placeholder">${picker.index === null ? 'Hinzufügen' : 'Ersetzen: ' + esc(list()[picker.index].name)}</p>
      <div id="results"></div>
    </div>`;
  const q = document.getElementById('q');
  q.addEventListener('input', () => renderResults(q.value));
  renderResults('');
  q.focus();
}

function renderResults(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = [];
  pool.forEach((ex, i) => {
    const s = (ex.name + ' ' + ex.muscle).toLowerCase();
    if (words.every(w => s.includes(w))) hits.push(i);
  });
  document.getElementById('results').innerHTML = hits.slice(0, 100).map(i => `
    <button class="result" data-act="pick" data-p="${i}">
      ${esc(pool[i].name)} <span class="exercise-muscle">${esc(pool[i].muscle)}</span>
    </button>`).join('') + (hits.length > 100 ? `<p class="placeholder">${hits.length - 100} weitere – Suche verfeinern.</p>` : '');
}

content.addEventListener('click', e => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const i = Number(btn.dataset.i);
  const arr = list().slice();
  switch (btn.dataset.act) {
    case 'del':
      if (!confirm(`„${arr[i].name}“ entfernen?`)) return;
      arr.splice(i, 1); save(arr); break;
    case 'swap': picker = { index: i }; break;
    case 'add': picker = { index: null }; break;
    case 'cancel': picker = null; break;
    case 'reset':
      if (!confirm('Tag auf Standard zurücksetzen?')) return;
      delete overrides[day];
      try { localStorage.setItem(KEY, JSON.stringify(overrides)); } catch (e2) {}
      break;
    case 'pick': {
      const p = pool[Number(btn.dataset.p)];
      const ex = { name: p.name, muscle: p.muscle, gif: p.gif };
      if (picker.index === null) arr.push(ex); else arr[picker.index] = ex;
      save(arr); picker = null; break;
    }
  }
  render();
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    day = tab.dataset.day;
    picker = null;
    render();
  });
});
