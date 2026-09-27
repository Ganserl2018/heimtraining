const tabs = document.querySelectorAll('.tab');
const content = document.getElementById('content');
const KEY = 'heimtraining.overrides';
const PKEY = 'heimtraining.progress'; // {date:'YYYY-MM-DD', done:{day:{übungsname:[bool,...]}}}
const HKEY = 'heimtraining.history';  // V2-01: [{date,day,totalSetsDone,totalSetsPlanned,exercises}], neueste zuletzt
const SETS = 3;                       // Annahme: 3 Sätze pro Übung (keine Info in den Daten)

let base = {};       // exercises.json (Standard)
let pool = [];       // pool.json (alle 514 Übungen)
let overrides = {};  // {day: [übungen]} – nur editierte Tage
let day = 'push';
let view = 'overview'; // 'overview' | 'day' | 'history' | 'tv'
const DAYS = ['push', 'pull', 'legs', 'core'];
const DAY_LABELS = { push: 'Push', pull: 'Pull', legs: 'Legs', core: 'Core' };
let tvIndex = 0;      // aktuelle Übung im TV-Modus
let picker = null;   // null = Tagesansicht, sonst {index} (index null = hinzufügen)

try { overrides = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { overrides = {}; }

// Abhak-State: an das lokale Datum gebunden – an einem neuen Tag startet alles leer.
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
let progress = null;
function prog() {
  if (!progress) { try { progress = JSON.parse(localStorage.getItem(PKEY)); } catch (e) { progress = null; } }
  if (!progress || progress.date !== today() || typeof progress.done !== 'object' || !progress.done) progress = { date: today(), done: {} };
  return progress;
}
function saveProg() { try { localStorage.setItem(PKEY, JSON.stringify(progress)); } catch (e) {} }
const setsOf = name => { const d = prog().done[day]; return (d && Array.isArray(d[name])) ? d[name] : []; };

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

function loadHistory() { try { return JSON.parse(localStorage.getItem(HKEY)) || []; } catch (e) { return []; } }
function pushHistory(rec) {
  const h = loadHistory();
  h.unshift(rec);
  try { localStorage.setItem(HKEY, JSON.stringify(h.slice(0, 200))); } catch (e) {}
}

function syncTabActive() {
  tabs.forEach(t => {
    const match = t.dataset.view ? t.dataset.view === view : (view === 'day' && t.dataset.day === day);
    t.classList.toggle('active', match);
  });
}

// V2-08: Sidebar zeigt pro Trainingstag die Übungsliste – Klick öffnet direkt "Tauschen".
function renderSidebarLists() {
  DAYS.forEach(d => {
    const el = document.querySelector(`[data-sublist="${d}"]`);
    if (!el) return;
    el.innerHTML = itemsFor(d).map((ex, i) =>
      `<button data-act="sideSwap" data-day="${d}" data-i="${i}">${esc(ex.name)}</button>`).join('');
  });
}

function render() {
  syncTabActive();
  renderSidebarLists();
  if (view === 'overview') return renderOverview();
  if (view === 'history') return renderHistory();
  if (view === 'tv') return renderTV();
  if (picker) return renderPicker();
  const items = list();
  content.innerHTML = (items.length ? '' : `<p class="placeholder">Keine Übungen.</p>`) +
    items.map((ex, i) => `
    <div class="exercise">
      <img class="exercise-gif" src="${esc(ex.gif)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
      <div class="exercise-info">
        <div class="exercise-name">${esc(ex.name)}</div>
        <div class="exercise-muscle">${esc(ex.muscle)}</div>
        <div class="sets">${Array.from({ length: SETS }, (_, k) =>
          `<button class="set${setsOf(ex.name)[k] ? ' done' : ''}" data-act="set" data-i="${i}" data-k="${k}">Satz ${k + 1}${setsOf(ex.name)[k] ? ' ✓' : ''}</button>`).join('')}</div>
      </div>
      <div class="exercise-actions">
        <button data-act="swap" data-i="${i}">Tauschen</button>
        <button data-act="del" data-i="${i}">Entfernen</button>
      </div>
    </div>`).join('') +
    `<div class="edit-bar">
      <button data-act="add">+ Übung hinzufügen</button>
      ${prog().done[day] ? '<button data-act="unset">Haken zurücksetzen (Training beenden)</button>' : ''}
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

// V2-07: Übersicht – Startseite mit Status heute, Wochenüberblick, Schnellzugriff, letzte Trainings.
const itemsFor = d => overrides[d] || base[d] || [];
const mondayOf = dateStr => { const d = new Date(dateStr + 'T00:00:00'); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return d.toISOString().slice(0, 10); };

function renderOverview() {
  const t = today();
  const h = loadHistory();
  const todayEntries = h.filter(r => r.date === t);
  const p = prog();
  const activeDay = Object.keys(p.done || {}).find(d => Object.keys(p.done[d] || {}).length > 0);

  let todayBlock;
  if (activeDay) {
    const setsDone = Object.values(p.done[activeDay]).reduce((s, arr) => s + arr.filter(Boolean).length, 0);
    const setsPlanned = itemsFor(activeDay).length * SETS;
    todayBlock = `<div>${DAY_LABELS[activeDay]}: ${setsDone}/${setsPlanned} Sätze</div>
      <button data-act="goto" data-day="${activeDay}">Weiter im Training</button>`;
  } else if (todayEntries.length) {
    todayBlock = todayEntries.map(r => `<div>${DAY_LABELS[r.day] || esc(r.day)} abgeschlossen: ${r.totalSetsDone}/${r.totalSetsPlanned} Sätze</div>`).join('');
  } else {
    todayBlock = `<p class="placeholder">Noch kein Training heute.</p>`;
  }

  const thisWeek = mondayOf(t);
  const doneThisWeek = new Set(h.filter(r => mondayOf(r.date) === thisWeek).map(r => r.day));

  content.innerHTML = `
    <div class="overview">
      <div class="ov-card">
        <div class="ov-card-title">Heute</div>
        ${todayBlock}
      </div>
      <div class="ov-card">
        <div class="ov-card-title">Diese Woche</div>
        <div class="ov-week">${DAYS.map(d => `<div class="ov-week-day${doneThisWeek.has(d) ? ' done' : ''}">${DAY_LABELS[d]}</div>`).join('')}</div>
      </div>
      <div class="ov-card">
        <div class="ov-card-title">Schnellzugriff</div>
        <div class="ov-quick">${DAYS.map(d => `<button data-act="goto" data-day="${d}">${DAY_LABELS[d]}</button>`).join('')}</div>
      </div>
      <div class="ov-card">
        <div class="ov-card-title">Letzte Trainings</div>
        ${h.length ? h.slice(0, 3).map(r => `<div class="history-item">
            <div class="history-date">${esc(r.date)} · ${DAY_LABELS[r.day] || esc(r.day)}</div>
            <div class="history-meta">${r.totalSetsDone}/${r.totalSetsPlanned} Sätze</div>
          </div>`).join('') : `<p class="placeholder">Noch keine Historie.</p>`}
        <button data-act="goto" data-view="history">Ganzer Verlauf</button>
      </div>
    </div>`;
}

// V2-01: Verlauf – zeigt vergangene Trainingseinheiten (aus HKEY, befüllt bei "Training beenden").
function renderHistory() {
  const h = loadHistory();
  content.innerHTML = (h.length ? '' : `<p class="placeholder">Noch kein Training abgeschlossen.</p>`) +
    h.map(r => {
      const pct = r.totalSetsPlanned ? Math.round(r.totalSetsDone / r.totalSetsPlanned * 100) : 0;
      return `<div class="history-item">
        <div class="history-date">${esc(r.date)} · ${esc(r.day)}</div>
        <div class="history-meta">${r.totalSetsDone}/${r.totalSetsPlanned} Sätze</div>
        <div class="history-bar"><div class="history-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');
}

// V2-03: TV-Modus – eine Übung groß, für AirPlay-Spiegelung auf Apple TV. Nutzt den zuletzt
// aktiven Trainingstag (day bleibt beim Wechsel in die TV-Ansicht unverändert).
function renderTV() {
  const items = list();
  if (!items.length) { content.innerHTML = `<p class="placeholder">Keine Übungen für „${esc(day)}“.</p>`; return; }
  if (tvIndex >= items.length) tvIndex = 0;
  if (tvIndex < 0) tvIndex = items.length - 1;
  const ex = items[tvIndex];
  content.innerHTML = `
    <div class="tv">
      <div class="tv-count">${tvIndex + 1} / ${items.length} · ${esc(day)}</div>
      <img class="tv-gif" src="${esc(ex.gif)}" alt="" onerror="this.style.visibility='hidden'">
      <div class="tv-name">${esc(ex.name)}</div>
      <div class="tv-muscle">${esc(ex.muscle)}</div>
      <div class="tv-sets">${Array.from({ length: SETS }, (_, k) =>
        `<button class="set${setsOf(ex.name)[k] ? ' done' : ''}" data-act="set" data-i="${tvIndex}" data-k="${k}">Satz ${k + 1}${setsOf(ex.name)[k] ? ' ✓' : ''}</button>`).join('')}</div>
      <div class="tv-nav">
        <button data-act="tvPrev">← Vorherige</button>
        <button data-act="tvNext">Nächste →</button>
      </div>
    </div>`;
}

// Health-Sync: absolvierte Einheit fire-and-forget an die API-Brücke (→ iOS-Kurzbefehl → Apple Health).
// Alle Übungen des Tages werden gesendet, auch unangerührte (setsDone: 0) – so ist der Plan komplett sichtbar.
const API = 'https://heimtraining-api.alexanderulbrich.workers.dev/session';
const TOKEN = 'ZWdwoYaX8GNC3f5yD9wBs0oY5_wYhS7p';
function buildSessionRecord(arr) {
  const d = prog().done[day];
  if (!d || !Object.keys(d).length) return null;
  const exercises = arr.map(x => ({ name: x.name, muscle: x.muscle, setsDone: (d[x.name] || []).filter(Boolean).length, setsTotal: SETS }));
  return { date: prog().date, day, exercises,
    totalSetsDone: exercises.reduce((s, x) => s + x.setsDone, 0), totalSetsPlanned: exercises.length * SETS,
    finishedAt: new Date().toISOString() };
}
function syncSession(body) {
  fetch(API, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .catch(err => console.error('Health-Sync fehlgeschlagen:', err));
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
    case 'set': {
      const p = prog(), name = arr[i].name, k = Number(btn.dataset.k);
      const names = new Set(arr.map(x => x.name));
      const d = p.done[day] = p.done[day] || {};
      Object.keys(d).forEach(n => { if (!names.has(n)) delete d[n]; }); // verwaiste Einträge (getauscht/entfernt) aufräumen
      const sets = Array.isArray(d[name]) ? d[name] : [];
      sets[k] = !sets[k];
      if (sets.some(Boolean)) d[name] = sets; else delete d[name];
      if (!Object.keys(d).length) delete p.done[day];
      saveProg(); break;
    }
    case 'unset': {
      const rec = buildSessionRecord(arr);
      if (rec) { syncSession(rec); pushHistory(rec); }
      delete prog().done[day]; saveProg(); break;
    }
    case 'tvPrev': tvIndex--; break;
    case 'tvNext': tvIndex++; break;
    case 'goto':
      if (btn.dataset.day) { day = btn.dataset.day; view = 'day'; }
      else if (btn.dataset.view) { view = btn.dataset.view; }
      picker = null;
      break;
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

document.getElementById('tabbar').addEventListener('click', e => {
  const btn = e.target.closest('button[data-act="sideSwap"]');
  if (!btn) return;
  day = btn.dataset.day;
  view = 'day';
  picker = { index: Number(btn.dataset.i) };
  render();
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    picker = null;
    if (tab.dataset.view) {
      view = tab.dataset.view;
      if (view === 'tv') tvIndex = 0;
    } else {
      day = tab.dataset.day;
      view = 'day';
    }
    render();
  });
});
