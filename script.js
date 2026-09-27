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
let picker = null;   // null = Tagesansicht, sonst {index[, wid]} (index null = hinzufügen)

// V2-09: Wochenplan – frei benennbare Trainings (parallel zu Push/Pull/Legs/Core), mit
// editierbarer Sätze-Anzahl, Gewicht pro Satz und Notizen (pro Übung + pro Einheit).
const WKEY = 'heimtraining.weekplan';
const WPKEY = 'heimtraining.weekplan.progress';
const WEEKDAY_SEED = [
  ['mon', 'Montagstraining'], ['tue', 'Dienstagstraining'], ['wed', 'Mittwochstraining'],
  ['thu', 'Donnerstagstraining'], ['fri', 'Freitagstraining'], ['sat', 'Samstagstraining'], ['sun', 'Sonntagstraining']
];
let weekplan = [];
let wId = null; // aktuell offenes Training im 'wtrain'-View
function loadWeekplan() {
  try {
    const raw = JSON.parse(localStorage.getItem(WKEY));
    if (Array.isArray(raw) && raw.length) return raw;
  } catch (e) {}
  return WEEKDAY_SEED.map(([id, name]) => ({ id, name, exercises: [] }));
}
function saveWeekplan() { try { localStorage.setItem(WKEY, JSON.stringify(weekplan)); } catch (e) {} }
weekplan = loadWeekplan();
const trainingById = id => weekplan.find(t => t.id === id);
function wProgRaw() {
  let wp = null;
  try { wp = JSON.parse(localStorage.getItem(WPKEY)); } catch (e) {}
  if (!wp || wp.date !== today() || typeof wp.done !== 'object' || !wp.done) wp = { date: today(), done: {} };
  return wp;
}
function saveWProg(wp) { try { localStorage.setItem(WPKEY, JSON.stringify(wp)); } catch (e) {} }

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

// V2-09: Sidebar-Kurzliste aller Wochenplan-Trainings (nur Desktop/Sidebar-Breite).
function renderWeekplanBlock() {
  const el = document.getElementById('weekplan-block');
  if (!el) return;
  el.innerHTML = weekplan.map(t =>
    `<button class="tab${(view === 'wtrain' && wId === t.id) ? ' active' : ''}" data-act="wOpen" data-id="${t.id}">${esc(t.name)}</button>`
  ).join('') + `<button class="tab" data-act="wNewTraining">+ Neues Training</button>`;
}

function currentList() {
  if (picker && picker.wid) { const t = trainingById(picker.wid); return t ? t.exercises : []; }
  return list();
}

function render() {
  syncTabActive();
  renderSidebarLists();
  renderWeekplanBlock();
  if (view === 'overview') return renderOverview();
  if (view === 'history') return renderHistory();
  if (view === 'tv') return renderTV();
  if (view === 'weeklist') return renderWeeklist();
  if (picker) return renderPicker();
  if (view === 'wtrain') return renderWTrain();
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
      <p class="placeholder">${picker.index === null ? 'Hinzufügen' : 'Ersetzen: ' + esc(currentList()[picker.index].name)}</p>
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
        ${r.note ? `<div class="history-note">${esc(r.note)}</div>` : ''}
      </div>`;
    }).join('');
}

// V2-09: Wochenplan-Liste (Content-Ansicht, funktioniert auf jeder Breite inkl. iPhone).
function renderWeeklist() {
  content.innerHTML = `
    <div class="weeklist">
      ${weekplan.map(t => `<div class="weeklist-card" data-act="wOpen2" data-id="${t.id}">
        <div class="weeklist-name">${esc(t.name)}</div>
        <div class="weeklist-meta">${t.exercises.length} Übung${t.exercises.length === 1 ? '' : 'en'}</div>
      </div>`).join('')}
      <button data-act="wNewTraining">+ Neues Training</button>
    </div>`;
}

// V2-09: Trainings-Detail – Übungen mit Video(GIF)/Erklärung, editierbare Sätze + Gewicht, Notizen.
function renderWTrain() {
  const t = trainingById(wId);
  if (!t) { view = 'overview'; return renderOverview(); }
  const wp = wProgRaw();
  const dOf = wp.done[t.id] || {};
  content.innerHTML = `
    <div class="wtrain-head">
      <h2>${esc(t.name)}</h2>
      <button data-act="wRename" data-id="${t.id}">Umbenennen</button>
    </div>
    ${t.exercises.length ? '' : '<p class="placeholder">Noch keine Übungen – füge welche hinzu.</p>'}
    ${t.exercises.map((ex, i) => {
      const sets = dOf[ex.name] || [];
      const setsCount = ex.sets || 3;
      return `<div class="w-exercise">
        <div class="w-ex-top">
          <img class="exercise-gif" src="${esc(ex.gif)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
          <div class="exercise-info">
            <div class="exercise-name">${esc(ex.name)}</div>
            <div class="exercise-muscle">${esc(ex.muscle)}</div>
          </div>
          <div class="w-ex-actions"><button data-act="wRemoveEx" data-id="${t.id}" data-i="${i}">– Entfernen</button></div>
        </div>
        <div class="w-sets-head">
          <span>Sätze: ${setsCount}</span>
          <button data-act="wSetsAdj" data-id="${t.id}" data-i="${i}" data-d="-1">–</button>
          <button data-act="wSetsAdj" data-id="${t.id}" data-i="${i}" data-d="1">+</button>
        </div>
        <div class="w-sets">${Array.from({ length: setsCount }, (_, k) => {
          const s = sets[k] || {};
          return `<div class="w-set">
            <button class="${s.done ? 'done' : ''}" data-act="wSetDone" data-id="${t.id}" data-i="${i}" data-k="${k}">${k + 1}${s.done ? ' ✓' : ''}</button>
            <input type="number" inputmode="decimal" placeholder="kg" value="${s.weight ?? ''}" data-act="wWeight" data-id="${t.id}" data-i="${i}" data-k="${k}">
          </div>`;
        }).join('')}</div>
        <textarea class="w-note" placeholder="Notiz zur Übung…" data-act="wExNote" data-id="${t.id}" data-i="${i}">${esc(ex.note || '')}</textarea>
      </div>`;
    }).join('')}
    <div class="edit-bar">
      <button data-act="wAddEx" data-id="${t.id}">+ Übung hinzufügen</button>
      ${t.exercises.length ? `<button data-act="wFinish" data-id="${t.id}">Training beenden</button>` : ''}
    </div>`;
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
      if (picker.wid) {
        const t = trainingById(picker.wid);
        const ex = { name: p.name, muscle: p.muscle, gif: p.gif, sets: 3, note: '' };
        if (picker.index === null) t.exercises.push(ex); else t.exercises[picker.index] = ex;
        saveWeekplan();
      } else {
        const ex = { name: p.name, muscle: p.muscle, gif: p.gif };
        if (picker.index === null) arr.push(ex); else arr[picker.index] = ex;
        save(arr);
      }
      picker = null; break;
    }
    case 'wOpen2': wId = btn.dataset.id; view = 'wtrain'; break;
    case 'wNewTraining': {
      const name = prompt('Name des neuen Trainings:');
      if (!name) return;
      const t = { id: 'w' + Date.now(), name, exercises: [] };
      weekplan.push(t); saveWeekplan();
      wId = t.id; view = 'wtrain'; break;
    }
    case 'wRename': {
      const t = trainingById(btn.dataset.id);
      const name = prompt('Neuer Name:', t.name);
      if (!name) return;
      t.name = name; saveWeekplan(); break;
    }
    case 'wRemoveEx': {
      const t = trainingById(btn.dataset.id);
      if (!confirm(`„${t.exercises[Number(btn.dataset.i)].name}“ entfernen?`)) return;
      t.exercises.splice(Number(btn.dataset.i), 1); saveWeekplan(); break;
    }
    case 'wSetsAdj': {
      const t = trainingById(btn.dataset.id), ex = t.exercises[Number(btn.dataset.i)];
      const next = (ex.sets || 3) + Number(btn.dataset.d);
      if (next < 1 || next > 10) return;
      ex.sets = next; saveWeekplan(); break;
    }
    case 'wSetDone': {
      const t = trainingById(btn.dataset.id), ex = t.exercises[Number(btn.dataset.i)], k = Number(btn.dataset.k);
      const wp = wProgRaw();
      const d = wp.done[t.id] = wp.done[t.id] || {};
      const sets = d[ex.name] = d[ex.name] || [];
      sets[k] = sets[k] || {};
      sets[k].done = !sets[k].done;
      saveWProg(wp); break;
    }
    case 'wAddEx': picker = { index: null, wid: btn.dataset.id }; break;
    case 'wFinish': {
      const t = trainingById(btn.dataset.id);
      const wp = wProgRaw(), dOf = wp.done[t.id] || {};
      const exercises = t.exercises.map(ex => {
        const sets = dOf[ex.name] || [];
        return { name: ex.name, muscle: ex.muscle, setsDone: sets.filter(s => s && s.done).length, setsTotal: ex.sets || 3,
          weights: sets.map(s => s && s.weight != null ? s.weight : null) };
      });
      const note = prompt('Notiz zu diesem Training (optional):', '') || '';
      const rec = { date: today(), day: t.name, exercises,
        totalSetsDone: exercises.reduce((s, x) => s + x.setsDone, 0), totalSetsPlanned: exercises.reduce((s, x) => s + x.setsTotal, 0),
        finishedAt: new Date().toISOString(), note };
      syncSession(rec); pushHistory(rec);
      delete wp.done[t.id]; saveWProg(wp);
      view = 'weeklist'; break;
    }
  }
  render();
});

content.addEventListener('input', e => {
  const el = e.target.closest('[data-act="wWeight"],[data-act="wExNote"]');
  if (!el) return;
  const t = trainingById(el.dataset.id);
  if (el.dataset.act === 'wExNote') {
    t.exercises[Number(el.dataset.i)].note = el.value;
    saveWeekplan();
  } else {
    const ex = t.exercises[Number(el.dataset.i)], k = Number(el.dataset.k);
    const wp = wProgRaw();
    const d = wp.done[t.id] = wp.done[t.id] || {};
    const sets = d[ex.name] = d[ex.name] || [];
    sets[k] = sets[k] || {};
    sets[k].weight = el.value === '' ? null : Number(el.value);
    saveWProg(wp);
  }
});

document.getElementById('tabbar').addEventListener('click', e => {
  const swapBtn = e.target.closest('button[data-act="sideSwap"]');
  if (swapBtn) {
    day = swapBtn.dataset.day;
    view = 'day';
    picker = { index: Number(swapBtn.dataset.i) };
    return render();
  }
  const wBtn = e.target.closest('button[data-act="wOpen"],button[data-act="wNewTraining"]');
  if (!wBtn) return;
  picker = null;
  if (wBtn.dataset.act === 'wOpen') { wId = wBtn.dataset.id; view = 'wtrain'; }
  else {
    const name = prompt('Name des neuen Trainings:');
    if (!name) return;
    const t = { id: 'w' + Date.now(), name, exercises: [] };
    weekplan.push(t); saveWeekplan();
    wId = t.id; view = 'wtrain';
  }
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
