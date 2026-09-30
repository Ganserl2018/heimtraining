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
let view = 'overview'; // 'overview' | 'day' | 'history' | 'tv' | 'allex' | 'weeklist' | 'wtrain' | 'profile'
const DAYS = ['push', 'pull', 'legs', 'core'];
const DAY_LABELS = { push: 'Push', pull: 'Pull', legs: 'Legs', core: 'Core' };
let tvIndex = 0;      // aktuelle Übung im TV-Modus
let tvReturn = null;  // V4: {view, day} – wohin "Zurück" aus der TV-Ansicht führt
let picker = null;   // null = Tagesansicht, sonst {index[, wid]} (index null = hinzufügen)
let filterMuscle = null; // V2-10: Bildergalerie-Picker – aktiver Muskelgruppen-Chip
let filterEquip = null;  // V2-10: aktiver Ausrüstungs-Chip
let filterCat = null;    // V2-10b: aktiver Kategorie-Chip (z.B. "warmup")
let renameId = null; // V2-09: id des Wochenplan-Trainings, das gerade inline umbenannt wird
let addingTraining = false; // V2-09: zeigt das Inline-Eingabefeld "Neues Training" in der Weeklist

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
// V6-01: fehlende Felder bei alten/bestehenden Trainings nachrüsten (weekdays/time optional, leer = kein Zeitplan)
weekplan.forEach(t => { if (!Array.isArray(t.weekdays)) t.weekdays = []; if (typeof t.time !== 'string') t.time = ''; });
const trainingById = id => weekplan.find(t => t.id === id);

// V6-01: Wochentag-Zuordnung + Uhrzeit (informativ, kein Cutoff) pro Wochenplan-Training.
const WD_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const WD_LABELS = { mon: 'Mo', tue: 'Di', wed: 'Mi', thu: 'Do', fri: 'Fr', sat: 'Sa', sun: 'So' };
const JS_DAY_TO_WD = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']; // Date.getDay(): 0=So
const wdKeyOf = dateStr => JS_DAY_TO_WD[new Date(dateStr + 'T00:00:00').getDay()];
const addDays = (dateStr, n) => { const d = new Date(dateStr + 'T00:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

// V8-02: persistenter Start-Log (im Gegensatz zu WPKEY NICHT täglich zurückgesetzt) – Basis
// für V6-05 Status "unvollständig" (auch rückwirkend) und für die Trainingsdauer (V8-03).
const SLKEY = 'heimtraining.trainingStarts';
function loadStarts() { try { return JSON.parse(localStorage.getItem(SLKEY)) || []; } catch (e) { return []; } }
function saveStarts(s) { try { localStorage.setItem(SLKEY, JSON.stringify(s.slice(-500))); } catch (e) {} }
function startOf(trainingId, dateStr) { return loadStarts().find(s => s.trainingId === trainingId && s.date === dateStr); }
function pushStart(trainingId) {
  const s = loadStarts();
  if (startOf(trainingId, today())) return; // schon gestartet heute
  s.push({ trainingId, date: today(), startedAt: new Date().toISOString() });
  saveStarts(s);
}

// V6-05: Status pro Training+Datum – 3 neutrale Stufen, rein aus App-eigenen Daten.
// 'geplant' = Tag noch nicht dran/in der Zukunft, 'offen' = heute dran, noch nicht erledigt.
function trainingStatusForDate(t, dateStr) {
  if (!t.weekdays || !t.weekdays.length || !t.weekdays.includes(wdKeyOf(dateStr))) return null;
  const done = loadHistory().some(r => r.trainingId === t.id && r.date === dateStr);
  if (done) return 'erledigt';
  const started = !!startOf(t.id, dateStr);
  const t0 = today();
  if (dateStr > t0) return 'geplant';
  if (dateStr === t0) return started ? 'unvollständig' : 'offen';
  return started ? 'unvollständig' : 'verpasst';
}
const STATUS_LABEL = { erledigt: 'Erledigt', unvollständig: 'Unvollständig', verpasst: 'Verpasst', offen: 'Heute', geplant: 'Geplant' };

// V7-01: Profil (Basis für Kalorienberechnung, V8-03).
const PROKEY = 'heimtraining.profile';
function loadProfile() { try { return JSON.parse(localStorage.getItem(PROKEY)) || {}; } catch (e) { return {}; } }
function saveProfile(p) { try { localStorage.setItem(PROKEY, JSON.stringify(p)); } catch (e) {} }

// V6-03: Ziel-Leiste v1 – frei definierbares Ziel (Zahl Trainings + Zeitraum in Tagen).
const GOALKEY = 'heimtraining.goal';
function loadGoal() { try { return JSON.parse(localStorage.getItem(GOALKEY)) || { target: 3, periodDays: 7 }; } catch (e) { return { target: 3, periodDays: 7 }; } }
function saveGoal(g) { try { localStorage.setItem(GOALKEY, JSON.stringify(g)); } catch (e) {} }
let goalEditing = false;
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

let metByName = {}; // V8-01/03: name -> MET-Wert
Promise.all([
  fetch('exercises.json').then(r => r.json()),
  fetch('pool.json').then(r => r.json()),
  fetch('met.json').then(r => r.json()).catch(() => [])
]).then(([b, p, met]) => {
  base = b; pool = p;
  met.forEach(m => { metByName[m.name] = m.met; });
  render();
}).catch(err => { content.innerHTML = `<p class="error">Fehler beim Laden: ${err}</p>`; });

// V8-03: Kalorien = gewichteter MET-Schnitt (nach erledigten Sätzen) × Körpergewicht × Dauer.
// Ohne Profil-Gewicht oder ohne Dauer keine Schätzung möglich -> null statt Rateergebnis.
function computeCalories(exercises, durationMin) {
  const profile = loadProfile();
  if (!profile.weight || !durationMin) return null;
  let metSum = 0, setsSum = 0;
  exercises.forEach(ex => {
    if (!ex.setsDone) return;
    const met = metByName[ex.name] || 5.0; // konservativer Fallback, falls Übung nicht in met.json
    metSum += met * ex.setsDone; setsSum += ex.setsDone;
  });
  if (!setsSum) return null;
  const avgMet = metSum / setsSum;
  return Math.round(avgMet * profile.weight * (durationMin / 60));
}

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

// V2-08/V3-01: Push/Pull/Legs/Core stecken jetzt geschachtelt unter dem Reiter "Alle Übungen"
// (Sidebar) statt als eigene Top-Level-Einträge. Start eingeklappt (Alex-Wunsch), pro Tag
// per Chevron auf-/zuklappbar – wie zuvor. Direktzugriff auf eine Übung öffnet weiter "Tauschen".
let subExpanded = {}; // {push:true} = Tag-Unterliste aufgeklappt; standardmäßig alles eingeklappt
function renderAllExBlock() {
  const el = document.getElementById('allex-block');
  if (!el) return;
  el.innerHTML = DAYS.map(d => {
    const items = itemsFor(d);
    const sub = `<div class="side-sublist">${items.map((ex, i) =>
      `<button data-act="sideSwap" data-day="${d}" data-i="${i}">${esc(ex.name)}</button>`).join('')}</div>`;
    return `<div class="side-group${!subExpanded[d] ? ' collapsed' : ''}">
      <div class="side-head">
        <button class="tab${(view === 'day' && day === d) ? ' active' : ''}" data-act="goDay" data-day="${d}">${DAY_LABELS[d]}</button>
        <button class="side-toggle" data-act="toggleSub" data-day="${d}">▾</button>
      </div>
      ${sub}
    </div>`;
  }).join('');
}

// V2-09: Sidebar-Kurzliste aller Wochenplan-Trainings (nur Desktop/Sidebar-Breite).
// V2-09e: befüllte Trainings ebenfalls eingeklappt, per Chevron aufklappbar (wie Push/Pull/Legs/Core).
let wSubExpanded = {}; // {trainingId:true} = aufgeklappt; standardmäßig alles eingeklappt
function renderWeekplanBlock() {
  const el = document.getElementById('weekplan-block');
  if (!el) return;
  el.innerHTML = weekplan.map(t => {
    const has = t.exercises && t.exercises.length;
    const sub = has ? `<div class="side-sublist">${t.exercises.map(ex =>
      `<button data-act="wOpen" data-id="${t.id}">${esc(ex.name)}</button>`).join('')}</div>` : '';
    return `<div class="side-group${has && !wSubExpanded[t.id] ? ' collapsed' : ''}">
      <div class="side-head">
        <button class="tab${(view === 'wtrain' && wId === t.id) ? ' active' : ''}" data-act="wOpen" data-id="${t.id}">${esc(t.name)}</button>
        ${has ? `<button class="side-toggle" data-act="toggleWSub" data-id="${t.id}">▾</button>` : ''}
      </div>
      ${sub}
    </div>`;
  }).join('') + `<button class="tab" data-act="wNewTraining">+ Neues Training</button>`;
}

function currentList() {
  if (picker && picker.wid) { const t = trainingById(picker.wid); return t ? t.exercises : []; }
  return list();
}

function render() {
  syncTabActive();
  renderAllExBlock();
  renderWeekplanBlock();
  if (view === 'overview') return renderOverview();
  if (view === 'history') return renderHistory();
  if (view === 'tv') return renderTV();
  if (view === 'weeklist') return renderWeeklist();
  if (view === 'allex') return renderAllEx();
  if (view === 'profile') return renderProfile();
  if (view === 'histdetail') return renderHistDetail();
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

// V2-10: Muskelgruppen zu groben deutschen Kategorien zusammengefasst (Daten liefern nur
// einzelne Muskeln, keine Übergruppen) + einfache Ausrüstungs-Erkennung per Namens-Keyword
// (die Datenbank hat kein eigenes Ausrüstungs-Feld – "Aufwärmen" gibt es in den Daten nicht,
// daher keine Chip dafür, um nichts vorzutäuschen).
const MUSCLE_GROUPS = {
  chest: 'Brust', shoulders: 'Schultern', traps: 'Rücken', lats: 'Rücken', 'middle back': 'Rücken', 'lower back': 'Rücken',
  biceps: 'Arme', triceps: 'Arme', forearms: 'Arme',
  abdominals: 'Bauch',
  quadriceps: 'Beine', hamstrings: 'Beine', calves: 'Beine', glutes: 'Beine', abductors: 'Beine', adductors: 'Beine',
  neck: 'Sonstiges'
};
const MUSCLE_GROUP_LIST = ['Brust', 'Rücken', 'Schultern', 'Arme', 'Bauch', 'Beine'];
const EQUIP_LIST = [['dumbbell', 'Kurzhantel'], ['barbell', 'Langhantel'], ['cable', 'Kabelzug/Seilzug'], ['band', 'Band'], ['none', 'Ohne Geräte']];
function matchesEquip(name, key) {
  const n = name.toLowerCase();
  if (key === 'none') return !['dumbbell', 'barbell', 'cable', 'band', 'smith', 'ez barbell'].some(k => n.includes(k));
  return n.includes(key);
}
const CAT_LIST = [['warmup', '🔥 Aufwärmen']];
function renderFilterChips() {
  const m = MUSCLE_GROUP_LIST.map(g =>
    `<button class="chip${filterMuscle === g ? ' active' : ''}" data-act="fMuscle" data-v="${g}">${g}</button>`).join('');
  const eq = EQUIP_LIST.map(([k, label]) =>
    `<button class="chip${filterEquip === k ? ' active' : ''}" data-act="fEquip" data-v="${k}">${label}</button>`).join('');
  const cat = CAT_LIST.map(([k, label]) =>
    `<button class="chip${filterCat === k ? ' active' : ''}" data-act="fCat" data-v="${k}">${label}</button>`).join('');
  return `<div class="filter-chips">${cat}${m}</div><div class="filter-chips">${eq}</div>`;
}

function renderPicker() {
  content.innerHTML = `
    <div class="picker">
      <div class="picker-head">
        <input id="q" type="search" placeholder="Übung suchen…" autocomplete="off">
        <button data-act="cancel">Abbrechen</button>
      </div>
      ${renderFilterChips()}
      <p class="placeholder">${picker.index === null ? 'Hinzufügen' : 'Ersetzen: ' + esc(currentList()[picker.index].name)}</p>
      <div id="results" class="results"></div>
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
    if (!words.every(w => s.includes(w))) return;
    if (filterMuscle && MUSCLE_GROUPS[ex.muscle] !== filterMuscle) return;
    if (filterEquip && !matchesEquip(ex.name, filterEquip)) return;
    if (filterCat && ex.category !== filterCat) return;
    hits.push(i);
  });
  document.getElementById('results').innerHTML = hits.slice(0, 60).map(i => `
    <button class="result" data-act="pick" data-p="${i}">
      <img class="result-gif" src="${esc(pool[i].gif)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
      <span class="result-info">
        <span class="exercise-name">${esc(pool[i].name)}</span>
        <span class="exercise-muscle">${esc(pool[i].muscle)}</span>
      </span>
    </button>`).join('') + (hits.length === 0 ? '<p class="placeholder">Keine Treffer – Filter/Suche anpassen.</p>' : '') +
    (hits.length > 60 ? `<p class="placeholder">${hits.length - 60} weitere – Suche verfeinern.</p>` : '');
}

// V2-07: Übersicht – Startseite mit Status heute, Wochenüberblick, Schnellzugriff, letzte Trainings.
const itemsFor = d => overrides[d] || base[d] || [];

// V8-05: Dauer-Schätzung + "zuletzt trainiert" pro Push/Pull/Legs/Core-Kategorie für die
// Übersicht (Alex-Wunsch: vor dem Start abschätzen können, ob's zeitlich noch passt).
const estimateMin = d => Math.round(itemsFor(d).length * SETS * 1.5);
function lastTrainedText(d, h) {
  const last = h.find(r => r.day === d); // h ist neueste-zuerst sortiert
  if (!last) return 'noch nie';
  const days = Math.round((new Date(today()) - new Date(last.date)) / 86400000);
  if (days <= 0) return 'heute';
  if (days === 1) return 'gestern';
  return `vor ${days} Tagen`;
}
// Fix (30.09., Checker-Review): .toISOString() rechnet in UTC und verschiebt in
// Zeitzonen mit positivem Offset (z.B. Europe/Berlin) das Datum um einen Tag zurück.
// Lokal rechnen wie today()/addDays().
const mondayOf = dateStr => { const d = new Date(dateStr + 'T00:00:00'); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

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
    todayBlock = `<div class="today-status"><div class="today-status-text">${DAY_LABELS[activeDay]}: <b>${setsDone}/${setsPlanned}</b> Sätze</div></div>
      <button class="ov-btn" data-act="goto" data-day="${activeDay}">Weiter im Training</button>`;
  } else if (todayEntries.length) {
    todayBlock = todayEntries.map(r => `<div class="today-status"><div class="today-status-text">${DAY_LABELS[r.day] || esc(r.day)} abgeschlossen: <b>${r.totalSetsDone}/${r.totalSetsPlanned}</b> Sätze</div></div>`).join('');
  } else {
    todayBlock = `<p class="today-placeholder">Noch kein Training heute.</p>`;
  }

  // V6-02: Quick-Start – offenes/unterbrochenes Wochenplan-Training hat Vorrang, sonst heute fälliges.
  const scheduled = weekplan.filter(w => w.weekdays && w.weekdays.length);
  const openTraining = weekplan.find(w => startOf(w.id, t) && !loadHistory().some(r => r.trainingId === w.id && r.date === t));
  const dueTraining = !openTraining ? scheduled.find(w => trainingStatusForDate(w, t) === 'offen') : null;
  const quick = openTraining || dueTraining;
  const quickSub = quick ? `${quick.exercises.length} Übung${quick.exercises.length === 1 ? '' : 'en'} geplant` : '';
  const quickBlock = quick
    ? `<div class="ov-card ov-quickstart">
        <div class="ov-card-title">${openTraining ? 'Weiter im Training' : 'Heute geplant'}</div>
        <div class="ov-quickstart-name">${esc(quick.name)}</div>
        <div class="ov-quickstart-sub">${esc(quickSub)}</div>
        <button class="ov-btn" data-act="quickStart" data-id="${quick.id}">${openTraining ? 'Weiter' : 'Jetzt starten'}</button>
      </div>`
    : (scheduled.length ? '' : '');

  // V6-03: Ziel-Leiste v1 – frei definierbares Ziel (Zahl + Zeitraum).
  const goal = loadGoal();
  const since = addDays(t, -(goal.periodDays - 1));
  const goalCount = h.filter(r => r.date >= since && r.date <= t).length;
  const goalPct = Math.min(100, Math.round(goalCount / goal.target * 100));
  const goalBlock = `<div class="ov-card">
    <div class="ov-card-title">Wochenziel</div>
    ${goalEditing
      ? `<div class="goal-edit">
          <label>Ziel <input id="goal-target" type="number" min="1" value="${goal.target}"> Trainings</label>
          <label>in <input id="goal-period" type="number" min="1" value="${goal.periodDays}"> Tagen</label>
          <div class="edit-bar"><button class="ov-btn" data-act="goalSave">Speichern</button><button class="ov-btn ov-btn-ghost" data-act="goalCancel">Abbrechen</button></div>
        </div>`
      : `<div class="goal-row">
          <p class="goal-text">${goalCount} <small>/ ${goal.target} Trainings</small></p>
          <button class="goal-edit-link" data-act="goalEdit">Anpassen</button>
        </div>
        <div class="goal-sub">in den letzten ${goal.periodDays} Tagen</div>
        <div class="goal-bar"><div class="goal-fill" style="width:${goalPct}%"></div></div>`}
  </div>`;

  // V6-05/06: Wochenplan-Statuskalender – Mo–So, je Training mit Wochentag-Zuordnung.
  const weekStart = mondayOf(t);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const calBlock = scheduled.length ? `<div class="ov-card">
    <div class="ov-card-title">Wochenplan diese Woche</div>
    <div class="cal-strip">${weekDates.map(ds => {
      const items = scheduled.map(w => ({ w, status: trainingStatusForDate(w, ds) })).filter(x => x.status);
      const worst = items.some(x => x.status === 'verpasst') ? 'verpasst'
        : items.some(x => x.status === 'unvollständig') ? 'unvollständig'
        : items.some(x => x.status === 'offen') ? 'offen'
        : items.length ? 'erledigt' : null;
      return `<div class="cal-day${worst ? ' cal-' + worst : ''}${ds === t ? ' cal-heute' : ''}" title="${items.map(x => esc(x.w.name) + ': ' + STATUS_LABEL[x.status]).join(', ')}">
        <div class="cal-wd">${WD_LABELS[wdKeyOf(ds)]}</div>
        <div class="cal-dot"></div>
      </div>`;
    }).join('')}</div>
    <div class="cal-legend">
      <span><i style="background:var(--ok)"></i>erledigt</span>
      <span><i style="background:var(--accent)"></i>heute offen</span>
      <span><i style="background:var(--warn)"></i>unvollständig</span>
      <span><i style="background:var(--bad)"></i>verpasst</span>
    </div>
  </div>` : '';

  content.innerHTML = `
    <div class="overview">
      ${quickBlock}
      ${goalBlock}
      ${calBlock}
      <div class="ov-card">
        <div class="ov-card-title">Heute</div>
        ${todayBlock}
      </div>
      <div class="ov-card">
        <div class="ov-card-title">Schnellzugriff</div>
        <div class="ov-quick">${DAYS.map(d => `<button data-act="goto" data-day="${d}">
            <span class="ov-quick-name">${DAY_LABELS[d]}</span>
            <span class="ov-quick-meta">~${estimateMin(d)} Min · ${lastTrainedText(d, h)}</span>
          </button>`).join('')}</div>
      </div>
      <div class="ov-card">
        <div class="ov-card-title">Letzte Trainings</div>
        ${h.length ? h.slice(0, 3).map(r => { const pct = r.totalSetsPlanned ? Math.round(r.totalSetsDone / r.totalSetsPlanned * 100) : 0; return `<div class="history-item">
            <div class="history-main">
              <div class="history-date">${esc(r.date)} · ${DAY_LABELS[r.day] || esc(r.day)}</div>
              <div class="history-meta">${r.totalSetsDone}/${r.totalSetsPlanned} Sätze</div>
            </div>
            <div class="history-ring" style="--pct:${pct}"><span>${pct}%</span></div>
          </div>`; }).join('') : `<p class="placeholder">Noch keine Historie.</p>`}
        <button class="ov-btn ov-btn-ghost history-footer-btn" data-act="goto" data-view="history">Ganzer Verlauf</button>
      </div>
    </div>`;
}

// V2-01: Verlauf – zeigt vergangene Trainingseinheiten (aus HKEY, befüllt bei "Training beenden").
// V8-04: Wochenplan-Einträge (haben trainingId) sind anklickbar -> Detailseite mit Dauer/Kalorien.
function renderHistory() {
  const h = loadHistory();
  content.innerHTML = (h.length ? '' : `<p class="placeholder">Noch kein Training abgeschlossen.</p>`) +
    h.map((r, i) => {
      const pct = r.totalSetsPlanned ? Math.round(r.totalSetsDone / r.totalSetsPlanned * 100) : 0;
      const clickable = r.trainingId != null;
      return `<div class="history-item${clickable ? ' clickable' : ''}"${clickable ? ` data-act="histOpen" data-idx="${i}"` : ''}>
        <div class="history-date">${esc(r.date)} · ${esc(r.day)}</div>
        <div class="history-meta">${r.totalSetsDone}/${r.totalSetsPlanned} Sätze${r.durationMin ? ' · ' + r.durationMin + ' Min' : ''}${r.calories ? ' · ~' + r.calories + ' kcal' : ''}</div>
        <div class="history-bar"><div class="history-fill" style="width:${pct}%"></div></div>
        ${r.note ? `<div class="history-note">${esc(r.note)}</div>` : ''}
      </div>`;
    }).join('');
}

let histDetailIdx = null;
function renderHistDetail() {
  const r = loadHistory()[histDetailIdx];
  if (!r) { view = 'history'; return renderHistory(); }
  const profile = loadProfile();
  content.innerHTML = `
    <div class="wtrain-head"><h2>${esc(r.day)}</h2><button data-act="histBack">← Zurück</button></div>
    <div class="ov-card">
      <div class="ov-card-title">${esc(r.date)}</div>
      <div class="hist-detail-stats">
        <div><b>${r.totalSetsDone}/${r.totalSetsPlanned}</b><span>Sätze</span></div>
        <div><b>${r.durationMin ?? '–'}</b><span>Minuten</span></div>
        <div><b>${r.calories ?? '–'}</b><span>kcal (geschätzt)</span></div>
      </div>
      ${r.calories == null ? `<p class="placeholder">${profile.weight ? 'Keine Dauer erfasst (Training ohne "Training starten"?).' : 'Kalorien-Schätzung braucht dein Gewicht im Profil.'}</p>` : ''}
    </div>
    <div class="ov-card">
      <div class="ov-card-title">Übungen</div>
      ${r.exercises.map(ex => `<div class="history-item">
        <div class="history-date">${esc(ex.name)}</div>
        <div class="history-meta">${ex.setsDone}/${ex.setsTotal} Sätze${ex.weights && ex.weights.some(w => w != null) ? ' · ' + ex.weights.filter(w => w != null).map(w => w + 'kg').join(', ') : ''}</div>
      </div>`).join('')}
    </div>
    ${r.note ? `<div class="ov-card"><div class="ov-card-title">Notiz</div><div class="history-note">${esc(r.note)}</div></div>` : ''}`;
}

// V2-09: Wochenplan-Liste (Content-Ansicht, funktioniert auf jeder Breite inkl. iPhone).
function renderWeeklist() {
  content.innerHTML = `
    <div class="weeklist">
      ${weekplan.map(t => `<div class="weeklist-card" data-act="wOpen2" data-id="${t.id}">
        <div class="weeklist-name">${esc(t.name)}</div>
        <div class="weeklist-meta">${t.exercises.length} Übung${t.exercises.length === 1 ? '' : 'en'}</div>
      </div>`).join('')}
      ${addingTraining
        ? `<div class="weeklist-card"><input id="new-training-name" placeholder="Name des Trainings…" autofocus>
             <div class="edit-bar"><button data-act="wNewTrainingSave">Speichern</button><button data-act="wNewTrainingCancel">Abbrechen</button></div></div>`
        : `<button data-act="wNewTraining">+ Neues Training</button>`}
    </div>`;
  if (addingTraining) document.getElementById('new-training-name')?.focus();
}

// V2-09: Trainings-Detail – Übungen mit Video(GIF)/Erklärung, editierbare Sätze + Gewicht, Notizen.
function renderWTrain() {
  const t = trainingById(wId);
  if (!t) { view = 'overview'; return renderOverview(); }
  const wp = wProgRaw();
  const dOf = wp.done[t.id] || {};
  const sNote = (wp.sessionNote || {})[t.id] || '';
  const started = startOf(t.id, today());
  content.innerHTML = `
    <div class="wtrain-head">
      ${renameId === t.id
        ? `<input id="rename-input" value="${esc(t.name)}">
           <div class="edit-bar"><button data-act="wRenameSave" data-id="${t.id}">Speichern</button><button data-act="wRenameCancel">Abbrechen</button></div>`
        : `<h2>${esc(t.name)}</h2><button data-act="wRename" data-id="${t.id}">Umbenennen</button>`}
    </div>
    <div class="w-schedule">
      <div class="w-schedule-days">${WD_KEYS.map(k =>
        `<button class="chip${t.weekdays.includes(k) ? ' active' : ''}" data-act="wDayToggle" data-id="${t.id}" data-wd="${k}">${WD_LABELS[k]}</button>`).join('')}</div>
      <input type="time" class="w-schedule-time" data-act="wTime" data-id="${t.id}" value="${esc(t.time || '')}" title="Uhrzeit (informativ, kein Cutoff)">
    </div>
    ${t.exercises.length
      ? `<div class="edit-bar">${started
          ? `<span class="placeholder">Gestartet um ${esc(started.startedAt.slice(11, 16))} Uhr</span>`
          : `<button data-act="wStart" data-id="${t.id}">▶ Training starten</button>`}</div>`
      : ''}
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
      ${t.exercises.length ? `
        <textarea class="w-note" placeholder="Notiz zum Training…" data-act="wSessionNote" data-id="${t.id}">${esc(sNote)}</textarea>
        <button data-act="wFinish" data-id="${t.id}">Training beenden</button>` : ''}
    </div>`;
  if (renameId === t.id) document.getElementById('rename-input')?.focus();
}

// V7-01: Profil-Seite – Basis für Kalorienberechnung (V8-03), keine Herzfrequenz nötig.
function renderProfile() {
  const p = loadProfile();
  content.innerHTML = `
    <div class="overview">
      <div class="ov-card">
        <div class="ov-card-title">Profil</div>
        <div class="profile-form">
          <label>Gewicht (kg)<input type="number" inputmode="decimal" data-act="profileField" data-field="weight" value="${p.weight ?? ''}"></label>
          <label>Alter (Jahre)<input type="number" inputmode="numeric" data-act="profileField" data-field="age" value="${p.age ?? ''}"></label>
          <label>Größe (cm)<input type="number" inputmode="numeric" data-act="profileField" data-field="height" value="${p.height ?? ''}"></label>
          <label>Geschlecht
            <select data-act="profileField" data-field="gender">
              <option value="">–</option>
              <option value="m" ${p.gender === 'm' ? 'selected' : ''}>Männlich</option>
              <option value="w" ${p.gender === 'w' ? 'selected' : ''}>Weiblich</option>
              <option value="d" ${p.gender === 'd' ? 'selected' : ''}>Divers</option>
            </select>
          </label>
        </div>
        <p class="placeholder">Wird für die Kalorien-Schätzung pro Training genutzt (ohne Herzfrequenz/Wearable).</p>
      </div>
    </div>`;
}

// V3: Mobile/Content-Seite für "Alle Übungen" – Push/Pull/Legs/Core zum Antippen
// (auf Desktop-Breite steht die Sidebar-Version daneben, hier der Direktzugriff für iPhone).
function renderAllEx() {
  content.innerHTML = `
    <div class="overview">
      <div class="ov-card">
        <div class="ov-card-title">Alle Übungen</div>
        <div class="ov-quick">${DAYS.map(d => `<button data-act="goto" data-day="${d}">${DAY_LABELS[d]}</button>`).join('')}</div>
      </div>
    </div>`;
}

// V2-03/V4: TV-Modus – eine Übung groß, für Screen-Mirroring/AirPlay auf Apple TV. Nutzt den
// zuletzt aktiven Trainingstag. V4: Einstieg jetzt über das TV-Icon oben rechts (von überall
// im Training aus erreichbar), "Zurück" führt sauber zur vorherigen Ansicht zurück.
function renderTV() {
  const backBtn = `<button data-act="tvBack">← Zurück</button>`;
  const items = list();
  if (!items.length) { content.innerHTML = `<p class="placeholder">Keine Übungen für „${esc(day)}“.</p>${backBtn}`; return; }
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
        ${backBtn}
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
  const btn = e.target.closest('button[data-act], .weeklist-card[data-act], .history-item[data-act]');
  if (!btn) return;
  const i = Number(btn.dataset.i);
  const arr = list().slice();
  if (btn.dataset.act === 'fMuscle') {
    filterMuscle = (filterMuscle === btn.dataset.v) ? null : btn.dataset.v;
    document.querySelectorAll('[data-act="fMuscle"]').forEach(b => b.classList.toggle('active', b.dataset.v === filterMuscle));
    renderResults(document.getElementById('q').value);
    return;
  }
  if (btn.dataset.act === 'fEquip') {
    filterEquip = (filterEquip === btn.dataset.v) ? null : btn.dataset.v;
    document.querySelectorAll('[data-act="fEquip"]').forEach(b => b.classList.toggle('active', b.dataset.v === filterEquip));
    renderResults(document.getElementById('q').value);
    return;
  }
  if (btn.dataset.act === 'fCat') {
    filterCat = (filterCat === btn.dataset.v) ? null : btn.dataset.v;
    document.querySelectorAll('[data-act="fCat"]').forEach(b => b.classList.toggle('active', b.dataset.v === filterCat));
    renderResults(document.getElementById('q').value);
    return;
  }
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
    case 'tvBack': view = tvReturn ? tvReturn.view : 'overview'; if (tvReturn && tvReturn.day) day = tvReturn.day; tvReturn = null; break;
    case 'goto':
      if (btn.dataset.day) { day = btn.dataset.day; view = 'day'; }
      else if (btn.dataset.view) { view = btn.dataset.view; }
      picker = null;
      break;
    case 'swap': picker = { index: i }; filterMuscle = null; filterEquip = null; filterCat = null; break;
    case 'add': picker = { index: null }; filterMuscle = null; filterEquip = null; filterCat = null; break;
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
    case 'wNewTraining': addingTraining = true; view = 'weeklist'; break;
    case 'wNewTrainingCancel': addingTraining = false; break;
    case 'wNewTrainingSave': {
      const name = (document.getElementById('new-training-name')?.value || '').trim();
      if (!name) return;
      const t = { id: 'w' + Date.now(), name, exercises: [] };
      weekplan.push(t); saveWeekplan();
      addingTraining = false; wId = t.id; view = 'wtrain'; break;
    }
    case 'wRename': renameId = btn.dataset.id; break;
    case 'wRenameCancel': renameId = null; break;
    case 'wRenameSave': {
      const name = (document.getElementById('rename-input')?.value || '').trim();
      if (!name) return;
      trainingById(btn.dataset.id).name = name; saveWeekplan();
      renameId = null; break;
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
    case 'wAddEx': picker = { index: null, wid: btn.dataset.id }; filterMuscle = null; filterEquip = null; filterCat = null; break;
    case 'wFinish': {
      const t = trainingById(btn.dataset.id);
      const wp = wProgRaw(), dOf = wp.done[t.id] || {};
      const exercises = t.exercises.map(ex => {
        const sets = dOf[ex.name] || [];
        return { name: ex.name, muscle: ex.muscle, setsDone: sets.filter(s => s && s.done).length, setsTotal: ex.sets || 3,
          weights: sets.map(s => s && s.weight != null ? s.weight : null) };
      });
      const note = (wp.sessionNote || {})[t.id] || '';
      const startRec = startOf(t.id, today());
      const durationMin = startRec ? Math.max(1, Math.round((Date.now() - new Date(startRec.startedAt)) / 60000)) : null;
      const calories = computeCalories(exercises, durationMin);
      const rec = { date: today(), day: t.name, trainingId: t.id, exercises,
        totalSetsDone: exercises.reduce((s, x) => s + x.setsDone, 0), totalSetsPlanned: exercises.reduce((s, x) => s + x.setsTotal, 0),
        finishedAt: new Date().toISOString(), durationMin, calories, note };
      syncSession(rec); pushHistory(rec);
      delete wp.done[t.id];
      if (wp.sessionNote) delete wp.sessionNote[t.id];
      saveWProg(wp);
      view = 'weeklist'; break;
    }
    case 'wDayToggle': {
      const t = trainingById(btn.dataset.id), wd = btn.dataset.wd;
      const idx = t.weekdays.indexOf(wd);
      if (idx === -1) t.weekdays.push(wd); else t.weekdays.splice(idx, 1);
      saveWeekplan(); break;
    }
    case 'wStart': pushStart(btn.dataset.id); break;
    case 'goalEdit': goalEditing = true; break;
    case 'goalSave': {
      const target = Math.max(1, Number(document.getElementById('goal-target')?.value) || 1);
      const periodDays = Math.max(1, Number(document.getElementById('goal-period')?.value) || 7);
      saveGoal({ target, periodDays }); goalEditing = false; break;
    }
    case 'goalCancel': goalEditing = false; break;
    case 'quickStart':
      wId = btn.dataset.id; view = 'wtrain'; picker = null; break;
    case 'histOpen': histDetailIdx = Number(btn.dataset.idx); view = 'histdetail'; break;
    case 'histBack': view = 'history'; break;
  }
  render();
});

content.addEventListener('input', e => {
  const profileEl = e.target.closest('[data-act="profileField"]');
  if (profileEl) {
    const p = loadProfile();
    p[profileEl.dataset.field] = profileEl.dataset.field === 'gender' ? profileEl.value : (profileEl.value === '' ? null : Number(profileEl.value));
    saveProfile(p);
    return;
  }
  const timeEl = e.target.closest('[data-act="wTime"]');
  if (timeEl) {
    trainingById(timeEl.dataset.id).time = timeEl.value;
    saveWeekplan();
    return;
  }
  const el = e.target.closest('[data-act="wWeight"],[data-act="wExNote"],[data-act="wSessionNote"]');
  if (!el) return;
  const t = trainingById(el.dataset.id);
  if (el.dataset.act === 'wSessionNote') {
    const wp = wProgRaw();
    wp.sessionNote = wp.sessionNote || {};
    wp.sessionNote[t.id] = el.value;
    saveWProg(wp);
  } else if (el.dataset.act === 'wExNote') {
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
    filterMuscle = null; filterEquip = null; filterCat = null;
    return render();
  }
  const toggleBtn = e.target.closest('button[data-act="toggleSub"]');
  if (toggleBtn) {
    const d = toggleBtn.dataset.day;
    subExpanded[d] = !subExpanded[d];
    return renderAllExBlock();
  }
  const goDayBtn = e.target.closest('button[data-act="goDay"]');
  if (goDayBtn) {
    day = goDayBtn.dataset.day; view = 'day'; picker = null;
    return render();
  }
  const toggleWBtn = e.target.closest('button[data-act="toggleWSub"]');
  if (toggleWBtn) {
    const id = toggleWBtn.dataset.id;
    wSubExpanded[id] = !wSubExpanded[id];
    return renderWeekplanBlock();
  }
  const wBtn = e.target.closest('button[data-act="wOpen"],button[data-act="wNewTraining"]');
  if (!wBtn) return;
  picker = null;
  if (wBtn.dataset.act === 'wOpen') { wId = wBtn.dataset.id; view = 'wtrain'; }
  else { addingTraining = true; view = 'weeklist'; }
  render();
});

// V4-02: TV-Icon oben rechts – von überall im Training erreichbar, merkt sich die
// vorherige Ansicht für den "Zurück"-Button in der TV-Ansicht.
document.getElementById('tvIconBtn').addEventListener('click', () => {
  tvReturn = { view, day };
  picker = null; view = 'tv'; tvIndex = 0;
  render();
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    picker = null;
    view = tab.dataset.view;
    render();
  });
});
