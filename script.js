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
let filterSplit = null; // Alle Übungen: Push/Pull/Beine-Kachel
let filterMuscle = null; // V2-10: Bildergalerie-Picker – aktiver Muskelgruppen-Chip
let filterEquip = null;  // V2-10: aktiver Ausrüstungs-Chip
let filterFav = false;   // nur Lieblingsübungen
let filterMus = null;    // Einzelmuskel-Filter (nur Alle Übungen)
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
const WEIGHT_WORDS = ['barbell', 'dumbbell', 'cable', 'smith', 'ez bar', 'ez-bar', 'kettlebell', 'machine', 'lever', 'weighted', 'plate', 'sled', 'pulldown', 'pec deck', 'leg press', 'leg extension', 'leg curl', 'hack squat', 'calf press', 'seated calf', 'preacher', 'trap bar', 'landmine', ' db ', 'db ', 'long bar', 't-bar', 'bench press', 'bench pull', 'shrug', 'bar row'];
function defaultUnit(name) { const n = (name || '').toLowerCase(); if (/plank|hold|stretch|hang|isometric/.test(n)) return 'sek'; if (/\bband/.test(n) || /with bands/.test(n)) return 'wdh'; return WEIGHT_WORDS.some(w => n.includes(w)) ? 'kg' : 'wdh'; }
function loadWeekplan() {
  try {
    const raw = JSON.parse(localStorage.getItem(WKEY));
    if (Array.isArray(raw) && raw.length) { const fixed = localStorage.getItem('heimtraining.unitfix1'); raw.forEach(t => (t.exercises || []).forEach(e => { if (e.unit === 'none') e.unit = 'wdh'; else if (!e.unit) e.unit = defaultUnit(e.name); else if (!fixed && e.unit === 'kg' && defaultUnit(e.name) !== 'kg') e.unit = defaultUnit(e.name); })); try { localStorage.setItem('heimtraining.unitfix1', '1'); } catch (e) {} return raw; }
  } catch (e) {}
  return WEEKDAY_SEED.map(([id, name]) => ({ id, name, exercises: [] }));
}
const ARKEY = 'heimtraining.archive'; let archOpen = false; let wpSheet = null;
function loadArchive() { try { const r = JSON.parse(localStorage.getItem(ARKEY)); return Array.isArray(r) ? r : []; } catch (e) { return []; } }
function saveArchive(a) { try { localStorage.setItem(ARKEY, JSON.stringify(a)); } catch (e) {} }
function saveWeekplan() { try { localStorage.setItem(WKEY, JSON.stringify(weekplan)); } catch (e) {} }
weekplan = loadWeekplan().filter(x => !x.draft || (x.exercises || []).length); weekplan.forEach(x => { if ((x.exercises || []).length) delete x.draft; });
// V6-01: fehlende Felder bei alten/bestehenden Trainings nachrüsten (weekdays/time optional, leer = kein Zeitplan)
weekplan.forEach(t => { if (!Array.isArray(t.exercises)) t.exercises = []; if (!Array.isArray(t.weekdays)) t.weekdays = []; if (typeof t.time !== 'string') t.time = ''; if (!t.since || typeof t.since !== 'object') t.since = {}; });
const trainingById = id => weekplan.find(t => t.id === id);

const UNITS = { kg: ['kg', 'kg'], sek: ['Sek', 's'], wdh: ['Wdh', 'Wdh'], none: ['ohne', ''] };
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
  if (!t.exercises || !t.exercises.length) return 'vorher'; // leeres Training: Hantel gedimmt, zählt nie als verpasst/offen
  const done = loadHistory().some(r => r.trainingId === t.id && r.date === dateStr);
  if (done) return 'erledigt';
  if ((t.skipped || []).includes(dateStr)) return 'vorher'; // als Ruhetag gewertet
  if (t.since && t.since[wdKeyOf(dateStr)] && dateStr < t.since[wdKeyOf(dateStr)]) return 'vorher'; // eingeplant, aber vor Planstart: zählt nicht als verpasst
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
// V6-04: Langzeit-Leiste (Trainings pro Jahr/Monat ODER Kraft-Ziel einer Übung)
const LGKEY = 'heimtraining.longgoal2';
let longEditing = false, longDraftType = null;
function loadLong() { try { return JSON.parse(localStorage.getItem(LGKEY)) || { type: 'count', target: 156, per: 'year' }; } catch (e) { return { type: 'count', target: 156, per: 'year' }; } }
function saveLong(g) { try { localStorage.setItem(LGKEY, JSON.stringify(g)); } catch (e) {} }
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
// V9-15: 'since' = ab welchem Datum ein Wochentag eingeplant ist; Tage davor zählen nie als verpasst
// (bestehende Pläne ohne since: ab heute, damit alte Tage dieser Woche nicht plötzlich rot werden).
weekplan.forEach(t => { if (!t.since || typeof t.since !== 'object') t.since = {}; t.weekdays.forEach(k => { if (!t.since[k]) t.since[k] = today(); }); });
let progress = null;
function prog() {
  if (!progress) { try { progress = JSON.parse(localStorage.getItem(PKEY)); } catch (e) { progress = null; } }
  if (!progress || progress.date !== today() || typeof progress.done !== 'object' || !progress.done) progress = { date: today(), done: {} };
  return progress;
}
function saveProg() { try { localStorage.setItem(PKEY, JSON.stringify(progress)); } catch (e) {} }
const setsOf = name => { const d = prog().done[day]; return (d && Array.isArray(d[name])) ? d[name] : []; };

let anleitungen = {};
let namesDe = {}; // names_de.json: englischer Schlüsselname -> deutsche Anzeige
const BADKEY = 'heimtraining.badimg';
function loadBad() { try { return JSON.parse(localStorage.getItem(BADKEY)) || []; } catch (e) { return []; } }
const dn = n => (loadProfile().lang === 'en' ? n : (namesDe[n] || n));
let gearFix = {}; // gearfix.json: Name -> {s:'ok'|'no', g:[Geräte]} (Alex' Heim-Gym, fest)
let metByName = {}; // V8-01/03: name -> MET-Wert
Promise.all([
  fetch('exercises.json').then(r => r.json()),
  fetch('pool.json').then(r => r.json()),
  fetch('met.json').then(r => r.json()).catch(() => []),
  fetch('gearfix.json').then(r => r.json()).catch(() => ({})),
  fetch('names_de.json').then(r => r.json()).catch(() => ({})),
  fetch('anleitungen_de.json').then(r => r.json()).catch(() => ({}))
]).then(([b, p, met, gf, nd, an]) => {
  base = b; pool = p; gearFix = gf; namesDe = nd; anleitungen = an;
  met.forEach(m => { metByName[m.name] = m.met; });
  try { if (!localStorage.getItem('heimtraining.warmmig1')) { weekplan.forEach(t => { if (t.exercises && t.exercises.length && !t.exercises.some(e => e.warm)) t.exercises.unshift(...warmupsFor(t.exercises)); }); saveWeekplan(); localStorage.setItem('heimtraining.warmmig1', '1'); } } catch (e) {}
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

const fmtDate = ds => { try { return new Date(ds + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return ds; } };
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
  try { localStorage.setItem(HKEY, JSON.stringify(h.slice(0, 1000))); } catch (e) {}
}

function syncTabActive() {
  tabs.forEach(t => {
    const match = t.dataset.view ? (t.dataset.view === view || (t.dataset.view === 'overview' && view === 'start' && !matchMedia('(min-width:820px)').matches) || (t.dataset.view === 'history' && view === 'histdetail') || (t.dataset.view === (wFrom || 'weeklist') && view === 'wtrain')) : (view === 'day' && t.dataset.day === day);
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
      `<button data-act="sideSwap" data-day="${d}" data-i="${i}">${esc(dn(ex.name))}</button>`).join('')}</div>`;
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
      `<button data-act="wOpen" data-id="${t.id}">${esc(dn(ex.name))}</button>`).join('')}</div>` : '';
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

// V9-14: Gesamtstimmung (grün/rot) gilt für die ganze App, nicht nur die Übersicht
function applyMood() {
  const t = today();
  const ws = mondayOf(t);
  const bad = weekplan.some(w => w.weekdays && w.weekdays.length && Array.from({ length: 7 }, (_, i) => addDays(ws, i))
    .some(ds => trainingStatusForDate(w, ds) === 'verpasst'));
  document.body.classList.toggle('mood-bad', bad);
  document.body.classList.toggle('mood-good', !bad);
}

function fitTabH() { const tb = document.getElementById('tabbar'); if (!tb) return; if (!tb.offsetHeight) { document.documentElement.style.setProperty('--tabh', '0px'); return; } const o = Math.max(0, document.body.getBoundingClientRect().bottom - tb.getBoundingClientRect().top); document.documentElement.style.setProperty('--tabh', Math.round(o) + 'px'); }
window.addEventListener('resize', fitTabH);
function mountGenPick() { // Direktauswahl liegt am body (über Kopfzeile + Tab-Leiste)
  const old = document.getElementById('gp-root'); if (old) old.remove();
  if (view !== 'gen' || genPick < 0 || !genRes || !genRes[genPick]) return;
  const d = document.createElement('div'); d.id = 'gp-root'; d.innerHTML = genPickHtml();
  d.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'genPickDo') genPickSet(b.dataset.name); else if (b.dataset.act === 'genPickClose') genPick = -1; else return;
    render();
  });
  document.body.appendChild(d);
}
function render() { renderView(); mountDetail(); mountPresetSheet(); mountGenPick(); fitTabH(); }
function renderView() {
  content.toggleAttribute('data-enter', view !== window._lv); window._lv = view;
  content.classList.remove('pl-scroll');
  document.body.classList.toggle('playing', view === 'play');
  document.body.classList.toggle('is-home', view === 'overview' && !dashMode);
  document.body.classList.toggle('is-start', view === 'start' || view === 'gen'); document.body.dataset.view = view; document.body.classList.toggle('is-gen', view === 'gen'); document.body.classList.toggle('is-res', view === 'gen' && !!genRes);
  weekplan.forEach(x => { if (x.draft && (x.exercises || []).length && !(view === 'wtrain' && wId === x.id)) delete x.draft; });
  if (weekplan.some(x => x.draft && !(view === 'wtrain' && wId === x.id) && view !== 'picker' && !picker)) weekplan = weekplan.filter(x => !x.draft || (view === 'wtrain' && wId === x.id));
  applyMood();
  const titles = { overview: 'Home Force', history: 'Verlauf', histdetail: 'Verlauf', weeklist: 'Woche', trainings: 'Trainings', start: 'Planung', gen: genRes ? 'Dein Training' : 'Einstellungen', play: 'Workout', preview: 'Training', summary: 'Geschafft', allex: 'Alle Übungen', profile: 'Profil', tv: 'TV-Ansicht', day: DAY_LABELS[day] || 'Training' };
  document.querySelector('.topbar h1').textContent = view === 'wtrain' ? ((trainingById(wId) || {}).name || 'Training') : (titles[view] || 'Home Force');
  syncTabActive();
  { const pn = (loadProfile().name || '').trim(), bad = document.body.classList.contains('mood-bad');
    const a = document.getElementById('side-av'), n = document.getElementById('side-nm'), m = document.getElementById('side-mood');
    if (a) a.textContent = pn.charAt(0).toUpperCase() || '◉'; if (n) n.textContent = pn || 'Profil';
    if (m) m.textContent = bad ? 'SYSTEM-LOCKDOWN' : 'KRITISCHE MASSE'; }
  renderAllExBlock();
  renderWeekplanBlock();
  if (view === 'overview') return renderOverview();
  if (view === 'history') return renderHistory();
  if (view === 'tv') return renderTV();
  if (view === 'weeklist') return renderWeeklist();
  if (view === 'trainings') return renderTrainings();
  if (view === 'start') return renderStart();
  if (view === 'preview') return renderPreview();
  if (view === 'gen') return renderGen();
  if (view === 'play') return renderPlay();
  if (view === 'summary') return renderSummary();
  if (view === 'allex') return renderAllEx();
  if (view === 'profile') return renderProfile();
  if (view === 'histdetail') return renderHistDetail();
  if (picker) return renderPicker();
  if (view === 'wtrain') return renderWTrain();
  const items = list();
  content.innerHTML = (items.length ? '' : `<p class="placeholder">Keine Übungen.</p>`) +
    items.map((ex, i) => `
    <div class="exercise">
      <img class="exercise-gif" src="${esc(imgOf(ex))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
      <div class="exercise-info">
        <div class="exercise-name">${esc(dn(ex.name))}</div>
        <div class="exercise-muscle">${esc(MUSCLE_DE[ex.muscle] || ex.muscle)}</div>
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
const EQUIP_LIST = [['dumbbell', 'Kurzhantel'], ['barbell', 'Langhantel'], ['cable', 'Seilzug'], ['band', 'Band'], ['none', 'Ohne Geräte']];
const DB_HIDDEN = /around the worlds|hammer curl|zottman|concentration curl|arnold|renegade|goblet|farmer|incline curl|preacher curl/i; // Kurzhantel-Übungen ohne das Wort im Namen
function matchesEquip(name, key) {
  const n = name.toLowerCase();
  if (DB_HIDDEN.test(n) && !/barbell|cable|band|smith|machine|kettlebell/.test(n)) return key === 'dumbbell';
  if (key === 'none') return !['dumbbell', 'barbell', 'cable', 'band', 'smith', 'ez barbell'].some(k => n.includes(k));
  return n.includes(key);
}
const CAT_LIST = [['warmup', '🔥 Aufwärmen']];
const MUSCLE_DE = { chest: 'Brust', shoulders: 'Schultern', triceps: 'Trizeps', biceps: 'Bizeps', quadriceps: 'Quadrizeps', hamstrings: 'Beinbeuger', glutes: 'Gesäß', calves: 'Waden', abdominals: 'Bauch', lats: 'Latissimus', 'middle back': 'Mittl. Rücken', 'lower back': 'Unt. Rücken', traps: 'Trapez', forearms: 'Unterarme', abductors: 'Abduktoren', adductors: 'Adduktoren', neck: 'Nacken' };
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
  browseLimit = BPAGE;
  content.innerHTML = `
    <div class="picker xr">
      <div class="xr-top">
        <div class="xr-search">${XR_SEARCH_ICO}<input id="q" type="search" placeholder="Übung suchen…" autocomplete="off">
          <button class="xr-filter" data-act="cancel">Abbrechen</button></div>
        ${xrPills(true)}
      </div>
      <p class="xr-hint">${picker.index === null ? 'Hinzufügen' : 'Ersetzen: ' + esc(dn(currentList()[picker.index].name))}</p>
      <div class="xr-count" id="pager-info"></div>
      <div id="results" class="xr-grid"></div>
      <button id="xr-more" class="xr-more" data-act="bMore" hidden></button>
    </div>`;
  const q = document.getElementById('q');
  q.addEventListener('input', () => { browseLimit = BPAGE; renderResults(q.value); });
  renderResults('');
  q.focus();
}

// Deutsche Suche: deutsche Begriffe (Stamm, ohne Umlaute) -> englische Namensbestandteile der Übungsdatenbank.
const DE_SYN = {
  bankdruecken: ['bench press'], schraegbank: ['incline'], schraegbankdruecken: ['incline bench', 'incline press'], negativbank: ['decline'], negativ: ['decline'],
  brustdruecken: ['chest press', 'bench press', 'push up', 'pushup'], fliegende: ['flye', 'fly', 'crossover'], butterfly: ['flye', 'fly', 'crossover'], kabelzug: ['cable', 'pulley'], seilzug: ['cable', 'pulley'], crossover: ['crossover'],
  kreuzheben: ['deadlift'], rumaenisch: ['romanian'], steifbeinig: ['stiff'], kniebeug: ['squat'], ausfallschritt: ['lunge', 'split squat'], beinpresse: ['leg press', 'sled', 'hack squat'], beinstreck: ['leg extension'],
  beinbeug: ['leg curl', 'hamstring'], beincurl: ['leg curl'], wadenheben: ['calf'], wade: ['calf'], huefte: ['hip'], hueftstoss: ['hip thrust', 'bridge', 'glute'], gesaess: ['glute', 'butt'], beinheben: ['leg raise', 'knee raise', 'hanging'], beine: ['leg', 'squat', 'lunge', 'calf'],
  liegestuetz: ['push up', 'pushup'], klimmzug: ['pull up', 'pullup', 'chin up'], klimmzuege: ['pull up', 'chin up'], latzug: ['pulldown', 'pull down'], latziehen: ['pulldown', 'pull down'], rudern: ['row'], vorgebeugt: ['bent'], aufrecht: ['upright'],
  schulterdruecken: ['shoulder press', 'overhead press', 'military press', 'arnold'], seitheben: ['lateral raise', 'side lateral'], frontheben: ['front raise'], hinterschulter: ['rear delt', 'rear lateral', 'reverse fly'], schulter: ['shoulder', 'delt'], nackendruecken: ['behind neck', 'behind the neck'],
  shrug: ['shrug'], schulterzucken: ['shrug'], trapez: ['shrug', 'trap'],
  bizeps: ['biceps', 'bicep'], curl: ['curl'], hammercurl: ['hammer'], hammer: ['hammer'], scott: ['preacher'], konzentrationscurl: ['concentration'], zottman: ['zottman'],
  trizeps: ['triceps', 'tricep'], trizepsdruecken: ['pushdown', 'tricep extension'], stirndruecken: ['skull crusher', 'lying triceps'], french: ['skull crusher', 'lying triceps'], kickback: ['kickback'], dips: ['dip'], ueberzug: ['pullover'], ueberzuege: ['pullover'], bankdips: ['dip'],
  bauch: ['crunch', 'sit up', 'ab ', 'oblique', 'plank', 'leg raise'], bauchpresse: ['crunch', 'sit up'], crunch: ['crunch'], situp: ['sit up'], unterarmstuetz: ['plank'], plank: ['plank'], russisch: ['russian'], rollout: ['rollout'], bauchroller: ['rollout'], seitstuetz: ['side plank', 'plank'], drehung: ['twist', 'rotation'], rotation: ['rotation'], woodchop: ['chop'],
  ruecken: ['back', 'row', 'pulldown', 'pull up', 'lat', 'deadlift'], rueckenstrecker: ['back extension', 'hyperextension', 'good morning'], hyperextension: ['hyperextension', 'back extension'], goodmorning: ['good morning'], nacken: ['neck'], unterarm: ['wrist', 'forearm'], handgelenk: ['wrist'], handgelenke: ['wrist'],
  brust: ['chest'], arme: ['curl', 'tricep', 'bicep'], oberschenkel: ['squat', 'leg', 'lunge'],
  kurzhantel: ['dumbbell'], langhantel: ['barbell'], hantel: ['dumbbell', 'barbell'], band: ['band'], widerstandsband: ['band'], theraband: ['band'], seil: ['rope'], stange: ['bar'], ezstange: ['ez'], kettlebell: ['kettlebell'], ball: ['ball'], koerpergewicht: ['bodyweight'], smith: ['smith'],
  sprung: ['jump'], spruenge: ['jump'], reissen: ['snatch'], umsetzen: ['clean'], stossen: ['jerk'], ziehen: ['pull', 'row'], druecken: ['press'], heben: ['raise', 'lift'], strecken: ['extension'], beugen: ['curl'],
  sitzend: ['seated'], stehend: ['standing'], liegend: ['lying'], einarmig: ['one arm', 'single arm'], beidarmig: ['two arm'], einbeinig: ['single leg', 'one leg'], enger: ['close'], breit: ['wide'], weit: ['wide'], umgekehrt: ['reverse'], schraeg: ['incline'], flach: ['flat'], seitlich: ['side', 'lateral'], haengend: ['hanging'], gestreckt: ['straight', 'stiff'], kniend: ['kneeling'], mittel: ['medium'], griff: ['grip'], untergriff: ['underhand', 'supinated'], obergriff: ['overhand', 'pronated'], vorne: ['front'], hinten: ['rear', 'behind'], hoch: ['high', 'up'], tief: ['low'], schwer: ['power'], explosiv: ['power', 'jump'], dehnen: ['stretch'],
};
const deNorm = t => String(t).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/-/g, ' ');
function wordMatches(w, ex) {
  const n = deNorm(w);
  const hay = deNorm(ex.name + ' ' + (namesDe[ex.name] || '') + ' ' + ex.muscle + ' ' + (MUSCLE_DE[ex.muscle] || '') + ' ' + (MUSCLE_GROUPS[ex.muscle] || '')) + ' ';
  if (hay.includes(n)) return true;
  if (/^aufwaerm|^warm/.test(n) && ex.category === 'warmup') return true;
  if (n.length < 3) return false;
  for (const k in DE_SYN) {
    if ((k.startsWith(n) || /^(e|en|n|s)$/.test(n.slice(k.length)) && n.startsWith(k)) && DE_SYN[k].some(t => hay.includes(t))) return true;
  }
  return false;
}

function renderResults(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = [];
  pool.forEach((ex, i) => {
    const s = (ex.name + ' ' + ex.muscle).toLowerCase();
    if (!words.every(w => wordMatches(w, ex))) return;
    if (filterMuscle && MUSCLE_GROUPS[ex.muscle] !== filterMuscle) return;
    if (filterSplit === 'warm' ? ex.category !== 'warmup' : filterSplit && !PRESET_FILL[filterSplit][0].includes(ex.muscle)) return;
    if (filterEquip && !matchesEquip(ex.name, filterEquip)) return;
    if (filterCat && ex.category !== filterCat) return;
    if (filterMus && ex.muscle !== filterMus) return;
    if (filterFav && !loadFavs().includes(ex.name)) return;
    hits.push(i);
  });
  const act = view === 'allex' ? 'browsePick' : 'pick';
  const landing = view === 'allex' && !filterMuscle && !filterSplit && !words.length && !filterEquip && !filterCat && !filterMus && !filterFav;
  if (landing) {
    const cover = g => { const l = pool.filter(e => MUSCLE_GROUPS[e.muscle] === g); return l.find(e => isCompound(e.name)) || l[0]; };
    document.getElementById('results').innerHTML = `<div class="wv-grid xr-landing"><button class="wv-tile wv-fav" data-act="fFav"><span class="wv-n">${pool.filter(e => loadFavs().includes(e.name)).length}</span><span class="wv-name">★ Favoriten</span></button>${MUSCLE_GROUP_LIST.map(g => { const e0 = cover(g), n = pool.filter(e => MUSCLE_GROUPS[e.muscle] === g).length; return `<button class="wv-tile" data-g="${g}" data-act="fMuscle" data-v="${g}">${e0 ? `<img src="${esc(imgOf(e0))}" alt="" onerror="this.style.visibility='hidden'">` : ''}<span class="wv-n">${n}</span><span class="wv-name">${g}</span></button>`; }).join('')}</div><div class="wv-grid xr-landing xr-split">${[{ key: 'warm', name: 'Warmup' }, ...PRESETS.filter(p => p.key === 'push' || p.key === 'pull')].map(p => { const w = p.key === 'warm', e0 = w ? pool.find(e => e.category === 'warmup') : presetExercises(p)[0], n = w ? pool.filter(e => e.category === 'warmup').length : pool.filter(e => PRESET_FILL[p.key][0].includes(e.muscle)).length; return `<button class="wv-tile" data-act="fSplit" data-v="${p.key}">${e0 ? `<img src="${esc(imgOf(e0))}" alt="" onerror="this.style.visibility='hidden'">` : ''}<span class="wv-n">${n}</span><span class="wv-name">${p.name}</span></button>`; }).join('')}</div>`;
    const info0 = document.getElementById('pager-info'); if (info0) info0.textContent = `${pool.length} Übungen · Muskelgruppe wählen`;
    const more0 = document.getElementById('xr-more'); if (more0) more0.hidden = true;
    return;
  }
  const shown = hits.slice(0, browseLimit);
  const favT = filterFav && view === 'allex' ? weekplan.filter(w => w.fav && !w.draft).map(w => `<button class="xr-ftr" data-act="wOpen2" data-id="${w.id}"><b>★ ${esc(w.name)}</b><em>Training · ${w.exercises.length} Übungen</em></button>`).join('') : '';
  document.getElementById('results').innerHTML = favT + shown.map(i => xrTile(i, act)).join('') +
    (hits.length === 0 ? '<p class="placeholder xr-empty">Keine Treffer – Filter/Suche anpassen.</p>' : '');
  const info = document.getElementById('pager-info');
  if (info) info.textContent = hits.length ? `${hits.length} Übungen` : '';
  const more = document.getElementById('xr-more');
  if (more) { const rest = hits.length - shown.length; more.hidden = rest <= 0; more.textContent = `Mehr laden · ${rest} weitere`; }
}

// V2-07: Übersicht – Startseite mit Status heute, Wochenüberblick, Schnellzugriff, letzte Trainings.
const itemsFor = d => overrides[d] || base[d] || [];

// Fix (30.09., Checker-Review): .toISOString() rechnet in UTC und verschiebt in
// Zeitzonen mit positivem Offset (z.B. Europe/Berlin) das Datum um einen Tag zurück.
// Lokal rechnen wie today()/addDays().
const mondayOf = dateStr => { const d = new Date(dateStr + 'T00:00:00'); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

// V9-01: Streak – Anzahl aufeinanderfolgender Tage (bis heute/gestern zurück) mit
// mind. 1 abgeschlossenem Training. Bricht ab, sobald ein Tag fehlt.
function computeStreak(h) {
  const trainedDates = new Set(h.map(r => r.date));
  let streak = 0;
  let cursor = today();
  // Heute noch nicht trainiert zählt nicht als Bruch – Streak darf bei gestern weiterlaufen.
  if (!trainedDates.has(cursor)) cursor = addDays(cursor, -1);
  while (trainedDates.has(cursor)) { streak++; cursor = addDays(cursor, -1); }
  return streak;
}

let dashMode = false;
function renderHome() {
  document.body.classList.remove('mood-bad');
  const t = today(), open = weekplan.find(w => startOf(w.id, t) && !loadHistory().some(r => r.trainingId === w.id && r.date === t));
  content.innerHTML = `<div class="home"><div class="home-brand"><b class="hb-home">HOME</b><b class="hb-main">FORCE</b></div><button class="home-btn" data-act="goto" data-view="start" aria-label="Start">
    <span class="home-ring"></span><span class="home-ring r2"></span><span class="home-ring r3"></span><svg class="home-pg" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="57"/></svg><span class="home-core"><i class="home-fill"></i>
    <svg viewBox="0 0 24 24" class="home-db" aria-hidden="true"><path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/></svg>
    <b>START</b></span></button>${open ? '<div class="home-open">Offenes Training wartet</div>' : ''}</div>`;
}
function renderOverview() {
  if (!dashMode) return renderHome();
  const t = today();
  const h = loadHistory();
  const p = prog();

  // V6-02: Quick-Start – offenes/unterbrochenes Wochenplan-Training hat Vorrang, sonst heute fälliges.
  const scheduled = weekplan.filter(w => w.weekdays && w.weekdays.length);
  const openTraining = weekplan.find(w => startOf(w.id, t) && !loadHistory().some(r => r.trainingId === w.id && r.date === t));
  const dueTraining = !openTraining ? scheduled.find(w => trainingStatusForDate(w, t) === 'offen') : null;
  const quick = openTraining || dueTraining;

  // V9-02: Start-Button "angebrochen" (Alex-Wunsch 01.10.) sobald diese Woche ein Training
  // verpasst wurde — Extra-Motivation ("muss weh tun"), aus V6-Planung schon vorgesehen.
  const weekStartForBtn = mondayOf(t);
  const hasMissedThisWeek = scheduled.some(w => Array.from({ length: 7 }, (_, i) => addDays(weekStartForBtn, i))
    .some(ds => trainingStatusForDate(w, ds) === 'verpasst'));
  // V9-01: Wochenziel als 2 Leisten (Trainings diese Woche + Streak) statt Ring/Einzelbalken
  // (Alex-Wunsch 01.10.: Nike-Style-Vorschlag hatte Ring, stattdessen 2 Balken).
  const goal = loadGoal();
  const since = goal.periodDays === 7 ? mondayOf(t) : addDays(t, -(goal.periodDays - 1)); // 7 Tage = Kalenderwoche wie der Streifen
  const goalCount = h.filter(r => r.date >= since && r.date <= t).length;
  const pdParts = goal.periodDays % 365 === 0 ? [goal.periodDays / 365, 'jahre'] : goal.periodDays % 30 === 0 ? [goal.periodDays / 30, 'monate'] : goal.periodDays % 7 === 0 ? [goal.periodDays / 7, 'wochen'] : [goal.periodDays, 'tage'];
  const streak = computeStreak(h);
  const goalBlock = `<div class="goal-sheet"><div class="goal-edit">
      <div class="ov-card-title">Ziel anpassen</div>
      <label>Ziel <input id="goal-target" type="number" min="1" inputmode="numeric" value="${goal.target}"> Trainings</label>
      <label>in <input id="goal-period" type="number" min="1" inputmode="numeric" value="${pdParts[0]}">
        <select id="goal-unit">${[['tage', 'Tagen'], ['wochen', 'Wochen'], ['monate', 'Monaten'], ['jahre', 'Jahren']].map(([v, l]) => `<option value="${v}"${pdParts[1] === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
      <div class="edit-bar"><button class="ov-btn" data-act="goalSave">Speichern</button><button class="ov-btn ov-btn-ghost" data-act="goalCancel">Abbrechen</button></div>
    </div></div>`;

  const weekStart = mondayOf(t);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  // V6-04: Wochen-Leiste + Langzeit-Leiste
  const wkItems = weekDates.flatMap(ds => scheduled.map(w => trainingStatusForDate(w, ds)).filter(x => x && x !== 'vorher'));
  const wkPlanned = wkItems.length, wkDone = wkItems.filter(x => x === 'erledigt').length;
  const lg = loadLong();
  const yr = t.slice(0, 4), since2 = lg.per === 'month' ? t.slice(0, 7) + '-01' : yr + '-01-01';
  const nDone = h.filter(r => r.date >= since2 && r.date <= t).length, tgt = Math.max(lg.target || 156, 1), left = Math.max(0, tgt - nDone);
  const lgTitle = 'COUNTDOWN ' + (lg.per === 'month' ? 'MONAT' : yr), lgLabel = left ? `NOCH ${left} VON ${tgt}` : 'ZIEL GESCHAFFT 🔥', lgPct = left / tgt;
  const bar = (title, label, pct, act) => `<${act ? 'button data-act="' + act + '"' : 'div'} class="lab-bar"><div class="lab-bar-top"><span>${esc(title)}</span><b>${esc(label)}</b></div><div class="lab-bar-track"><i style="width:${Math.round(Math.max(0, Math.min(1, pct)) * 100)}%"></i></div></${act ? 'button' : 'div'}>`;
  const barsBlock = `<div class="lab-bars">${bar(goal.periodDays <= 10 ? 'DIESE WOCHE' : goal.periodDays <= 45 ? 'DIESER MONAT' : goal.periodDays <= 135 ? 'DIESES QUARTAL' : goal.periodDays <= 270 ? 'DIESES HALBJAHR' : 'DIESES JAHR', goalCount + ' / ' + goal.target, goalCount / Math.max(goal.target, 1))}${bar(lgTitle, lgLabel, lgPct, 'longEdit')}</div>`;
  const exNames = [...new Set([...h.flatMap(r => r.exercises.map(e => e.name)), ...weekplan.flatMap(w => w.exercises.map(e => e.name))])];
  const dt = longDraftType || lg.type;
  const longBlock = `<div class="goal-sheet"><div class="goal-edit">
      <div class="ov-card-title">Langzeit-Ziel</div>
      <label>Ziel <input id="lg-target" type="number" min="1" inputmode="numeric" value="${lg.target || 156}"> Trainings pro
        <select id="lg-per"><option value="year"${lg.per !== 'month' ? ' selected' : ''}>Jahr</option><option value="month"${lg.per === 'month' ? ' selected' : ''}>Monat</option></select></label>
      <div class="edit-bar"><button class="ov-btn" data-act="longSave">Speichern</button><button class="ov-btn ov-btn-ghost" data-act="longCancel">Abbrechen</button></div>
    </div></div>`;

  // V9-03: Lab-Design nach Gemini-Vorlagen (grün/rot, Gesamtstimmung folgt dem Zustand)
  const mood = hasMissedThisWeek ? 'mood-bad' : 'mood-good';
  const moodTitle = hasMissedThisWeek ? 'SYSTEM-LOCKDOWN' : 'KRITISCHE MASSE';
  const moodSub = hasMissedThisWeek ? 'Phase Shift: tiefes Karmesin' : 'Phase Shift: Energie';
  const btnSub = hasMissedThisWeek ? '(WARNUNG: LEBENSGEFAHR!)' : '(AUTO-LOAD MAX!)';
  const doneToday = !quick && scheduled.some(w => trainingStatusForDate(w, t) === 'erledigt');
  const startAttr = openTraining ? `data-act="quickStart" data-id="${openTraining.id}"` : `data-act="goto" data-view="start"`;
  const startLabel = openTraining ? 'WORKOUT FORTSETZEN' : 'START WORKOUT';
  // Ring-Beschriftung folgt dem Zeitraum des Ziels (7 Tage = Woche, 30 = Monat, 180 = Halbjahr, 365 = Jahr)
  const pd = goal.periodDays;
  const periodLabel = pd <= 10 ? 'WOCHENTRAINING' : pd <= 45 ? 'MONATSTRAINING' : pd <= 135 ? 'QUARTALSTRAINING' : pd <= 270 ? 'HALBJAHRESTRAINING' : 'JAHRESTRAINING';
  const R = 70, C = 2 * Math.PI * R, ARC = C * 0.75;
  const ringFill = ARC * Math.min(1, goalCount / Math.max(goal.target, 1));
  const ringBlock = `<div class="lab-ring">
      <svg viewBox="0 0 180 180" aria-hidden="true">
        <circle class="lab-ring-bg" cx="90" cy="90" r="${R}" stroke-dasharray="${ARC} ${C}" transform="rotate(135 90 90)"/>
        ${ringFill > 0 ? `<circle class="lab-ring-fg" cx="90" cy="90" r="${R}" stroke-dasharray="${ringFill} ${C}" transform="rotate(135 90 90)"/>` : ''}
      </svg>
      <div class="lab-ring-text"><small>${periodLabel}</small><b>${goalCount}/${goal.target}</b><span>WORKOUTS</span></div>
    </div>`;
  const wdOrder = weekDates.map(ds => {
    const items = scheduled.map(w => ({ w, status: trainingStatusForDate(w, ds) })).filter(x => x.status);
    const worst = items.some(x => x.status === 'verpasst') ? 'verpasst'
      : items.some(x => x.status === 'unvollständig') ? 'unvollständig'
      : items.some(x => x.status === 'offen') ? 'offen'
      : items.some(x => x.status === 'geplant') ? 'geplant'
      : items.some(x => x.status === 'vorher') ? 'vorher'
      : items.length ? 'erledigt' : null;
    const DB = '<svg class="lab-db" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/></svg>';
    const hasEx = items.some(x => x.w.exercises.length);
    const sub = !worst ? '–' : worst === 'verpasst' ? '⚠' : worst === 'unvollständig' ? '!' : DB;
    const target = (items.find(x => x.status !== 'erledigt') || items[0] || {}).w;
    const act = target ? `data-act="wOpen2" data-id="${target.id}"` : `data-act="wDayNew" data-wd="${wdKeyOf(ds)}" data-date="${ds}"`;
    return `<button class="lab-day${worst ? ' lab-' + worst + ' lab-belegt' : ' lab-frei'}${worst && worst !== 'verpasst' ? (hasEx ? ' lab-ex' : ' lab-leer') : ''}${ds === t ? ' lab-heute' : ''}" ${act}><b>${WD_LABELS[wdKeyOf(ds)]}</b><span>${sub}</span><small class="lab-occ">${items.length ? items.map(x => esc(x.w.name)).join(' · ') : 'frei'}</small></button>`;
  }).join('');

  content.innerHTML = `
    <div class="overview overview-lab ${mood}">
      <div class="lab-head">
        <div class="lab-brand">
          <img class="lab-logo" src="logo.svg" alt="" width="46" height="46">
          <div>
            <div class="lab-head-title">HOME FORCE</div>
            <div class="lab-chip"><i></i>${moodTitle}</div>
          </div>
        </div>
        <button class="lab-badge" data-act="goto" data-view="profile" aria-label="Profil">${(loadProfile().name || '').trim().charAt(0).toUpperCase() || '◉'}</button>
      </div>
      ${ringBlock}
      <button class="lab-goal-link" data-act="goalEdit">Ziel anpassen</button>
      ${barsBlock}
      <div class="lab-streak">STREAK: ${streak} TAG${streak === 1 ? '' : 'E'}${hasMissedThisWeek ? ' (KRITISCH)' : ''} 🔥</div>
      <button class="lab-start${hasMissedThisWeek ? ' lab-start-broken' : ''}" ${startAttr}>
        <svg class="lab-start-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><span>${startLabel}<small>${quick ? btnSub : ''}</small></span>
      </button>
      <div class="lab-section">WOCHENTAGE · BELEGUNG</div>
      <div class="lab-week">${wdOrder}</div>
    </div>${goalEditing ? goalBlock : ''}${longEditing ? longBlock : ''}`;
}

// V2-01: Verlauf – zeigt vergangene Trainingseinheiten (aus HKEY, befüllt bei "Training beenden").
// V8-04: Wochenplan-Einträge (haben trainingId) sind anklickbar -> Detailseite mit Dauer/Kalorien.
// V6-08: Verlauf als Foto-Kacheln mit Wochenkopf, Gruppierung nach Woche/Monat.
let imgSet = new Set();
fetch('img/index.json?v=488').then(r => r.json()).then(a => { imgSet = new Set(a); }).catch(() => {});
function slugOf(g) { return (g || '').replace(/^gifs\//, '').replace(/\.gif$/, ''); }
// Foto passend zum Profil (m/w); ohne Foto -> GIF
function imgOf(ex) {
  const g = (loadProfile().gender === 'w') ? 'w' : 'm', s = slugOf(ex.gif);
  return imgSet.has(s + '-' + g + '.gif') ? 'img/' + s + '-' + g + '.gif' : imgSet.has(s + '-' + g) ? 'img/' + s + '-' + g + '.jpg' : ex.gif;
}
const gifOf = name => (pool.find(e => e.name === name) || {}).gif || '';
const hvPhoto = name => { const g = gifOf(name); return g ? `<img src="${esc(imgOf({ gif: g }))}" alt="" loading="lazy" onerror="this.remove()">` : ''; };
const isoDay = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function weekStart(ds) { const d = new Date(ds + 'T00:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return isoDay(d); }
function histStreak(h) {
  const days = new Set(h.map(r => r.date)); let d = new Date();
  if (!days.has(isoDay(d))) d.setDate(d.getDate() - 1);
  let n = 0; while (days.has(isoDay(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function histGroup(ds) {
  const ws = weekStart(ds), cur = weekStart(isoDay(new Date()));
  if (ws === cur) return 'Diese Woche';
  const diff = Math.round((new Date(cur) - new Date(ws)) / 604800000);
  if (diff === 1) return 'Letzte Woche';
  return new Date(ds + 'T00:00:00').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}
function renderHistory() {
  const h = loadHistory();
  if (!h.length) { content.innerHTML = `<div class="em-st"><div class="em-ring"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17l6-6 4 4 8-9M15 6h6v6"/></svg></div><h2>Noch leer</h2><p>Hier wächst dein Fortschritt: jedes Training, jeder Satz, jede Serie.</p><button class="qk-go wander" data-act="genOpen">ERSTES TRAINING BAUEN</button></div>`; return; }
  const dashBtn = '<button class="hist-dash" data-act="dash">Ziele &amp; Streak ›</button>';
  const cur = weekStart(isoDay(new Date()));
  const wk = h.filter(r => weekStart(r.date) === cur);
  const wkSets = wk.reduce((a, r) => a + (r.totalSetsDone || 0), 0);
  let lastG = '', ci = 0;
  const cards = h.map((r, i) => {
    const g = histGroup(r.date), head = g !== lastG ? `<div class="hv-grp">${esc(g)}</div>` : ''; lastG = g;
    const pct = r.totalSetsPlanned ? Math.round(r.totalSetsDone / r.totalSetsPlanned * 100) : 0;
    const full = r.totalSetsPlanned > 0 && r.totalSetsDone >= r.totalSetsPlanned;
    const click = r.trainingId != null;
    const d = new Date(r.date + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
    return head + `<div class="hv-card${click ? ' clickable' : ''}${full ? ' full' : ''}"${click ? ` data-act="histOpen" data-idx="${i}"` : ''}>
      <div class="hv-ph">${hvPhoto((r.exercises[0] || {}).name)}</div>
      <div class="hv-body">
        <div class="hv-top"><span class="hv-date">${esc(d)}</span><span class="${full ? 'hist-full' : 'hist-part'}">${full ? 'komplett' : 'unvollständig'}</span></div>
        <div class="hv-name">${esc(DAY_LABELS[r.day] || r.day)}</div>
        <div class="hv-nums"><div><b>${r.durationMin ?? '–'}</b><span>Min</span></div><div><b>${r.totalSetsDone}/${r.totalSetsPlanned}</b><span>Sätze</span></div><div><b>${r.calories ? '~' + r.calories : '–'}</b><span>kcal</span></div></div>
      </div>
      <div class="hv-bar"><div class="hv-fill" style="width:${pct}%;--i:${ci++ % 8}"></div></div>
      ${r.note ? `<div class="hv-note">${esc(r.note)}</div>` : ''}
    </div>`;
  }).join('');
  content.innerHTML = `<div class="hv">${dashBtn}
    <div class="hv-week">
      <div><b>${wk.length}</b><span>Trainings diese Woche</span></div>
      <div><b>${histStreak(h)}</b><span>Tage Streak</span></div>
      <div><b>${wkSets}</b><span>Sätze diese Woche</span></div>
    </div>
    <div class="hv-list">${cards}</div>
  </div>`;
}

let histDetailIdx = null;
function renderHistDetail() {
  const r = loadHistory()[histDetailIdx];
  if (!r) { view = 'history'; return renderHistory(); }
  const profile = loadProfile();
  const pct = r.totalSetsPlanned ? Math.round(r.totalSetsDone / r.totalSetsPlanned * 100) : 0;
  const full = r.totalSetsPlanned > 0 && r.totalSetsDone >= r.totalSetsPlanned;
  const first = (r.exercises[0] || {}).name;
  const unitTxt = u => (UNITS[u || 'kg'] || UNITS.kg)[1];
  content.innerHTML = `<div class="hd">
    <div class="hd-hero">
      ${hvPhoto(first)}
      <button class="hd-back" data-act="histBack">← Zurück</button>
      <div class="hd-hero-txt"><span class="${full ? 'hist-full' : 'hist-part'}">${full ? 'komplett' : 'unvollständig'}</span>
        <div class="hd-title">${esc(DAY_LABELS[r.day] || r.day)}</div>
        <div class="hd-date">${esc(fmtDate(r.date))}</div></div>
    </div>
    <div class="hd-stats">
      <div><b>${r.totalSetsDone}/${r.totalSetsPlanned}</b><span>Sätze</span></div>
      <div><b>${r.durationMin ?? '–'}</b><span>Minuten</span></div>
      <div><b>${r.calories ?? '–'}</b><span>kcal (geschätzt)</span></div>
      <div class="hv-bar"><div class="hv-fill" style="width:${pct}%;--i:0"></div></div>
    </div>
    ${r.calories == null ? `<p class="placeholder">${profile.weight ? 'Keine Dauer erfasst (Training ohne "Training starten"?).' : 'Kalorien-Schätzung braucht dein Gewicht im Profil.'}</p>` : ''}
    <div class="hd-exs">${r.exercises.map(ex => {
      const ws = ex.weights || [], u = unitTxt(ex.unit);
      const chips = Array.from({ length: ex.setsTotal || 0 }, (_, k) => {
        const done = k < ex.setsDone, w = ws[k];
        return `<span class="hd-w${done ? ' on' : ''}">${w != null ? esc(w) + (u ? ' ' + u : '') : (done ? '✓' : '–')}</span>`;
      }).join('');
      return `<div class="hd-ex"><div class="hd-th exinfo" data-act="exInfo" data-name="${esc(ex.name)}">${hvPhoto(ex.name) || `<i>${esc(ex.name.charAt(0))}</i>`}</div>
        <div class="hd-nm exinfo" data-act="exInfo" data-name="${esc(ex.name)}"><b>${esc(dn(ex.name))}</b><span>${esc(MUSCLE_DE[ex.muscle] || ex.muscle || '')}</span></div>
        <div class="hd-cnt">${ex.setsDone}/${ex.setsTotal}</div>
        <div class="hd-chips">${chips}</div></div>`;
    }).join('')}</div>
    ${r.note ? `<div class="ov-card"><div class="ov-card-title">Notiz</div><div class="history-note">${esc(r.note)}</div></div>` : ''}
    <button class="ov-btn ov-btn-ghost" data-act="histDelete">Eintrag löschen</button>
  </div>`;
}

// V2-09: Wochenplan-Liste (Content-Ansicht, funktioniert auf jeder Breite inkl. iPhone).
// Vorlagen für die Trainingsauswahl (Namen aus pool.json; fehlende werden übersprungen)
const PRESETS = [
  { key: 'push', grp: 'split', name: 'Push', ex: ['Barbell Bench Press - Medium Grip', 'Incline Dumbbell Press', 'Dumbbell Flyes', 'Side Lateral Raise', 'Triceps Pushdown', 'Dips - Triceps Version'] },
  { key: 'pull', grp: 'split', name: 'Pull', ex: ['Bent Over Barbell Row', 'Wide-Grip Lat Pulldown', 'Pullups', 'Face Pull', 'Barbell Curl', 'Alternate Hammer Curl'] },
  { key: 'legs', grp: 'split', name: 'Beine', ex: ['Barbell Squat', 'Romanian Deadlift', 'Dumbbell Lunges', 'Barbell Hip Thrust', 'Standing Barbell Calf Raise'] },
  { key: 'back', grp: 'musc', name: 'Rücken', ex: ['Bent Over Barbell Row', 'Wide-Grip Lat Pulldown', 'Pullups', 'Straight-Arm Pulldown', 'Barbell Shrug'] },
  { key: 'chest', grp: 'musc', name: 'Brust', ex: ['Barbell Bench Press - Medium Grip', 'Incline Dumbbell Press', 'Dumbbell Flyes', 'Decline Barbell Bench Press', 'Push-Up Wide'] },
  { key: 'shoulders', grp: 'musc', name: 'Schultern', ex: ['Side Lateral Raise', 'Face Pull', 'Dumbbell Shrug', 'Arnold Dumbbell Press', 'Dumbbell Lying Rear Lateral Raise'] },
  { key: 'triceps', grp: 'musc', name: 'Trizeps', ex: ['Triceps Pushdown', 'EZ-Bar Skullcrusher', 'Triceps Pushdown - Rope Attachment', 'Bench Dips', 'Close-Grip Barbell Bench Press'] },
  { key: 'biceps', grp: 'musc', name: 'Bizeps', ex: ['Barbell Curl', 'Alternate Hammer Curl', 'Cable Preacher Curl', 'Alternate Incline Dumbbell Curl'] },
  { key: 'core', grp: 'core', name: 'Core', ex: ['Cable Crunch', 'Hanging Leg Raise', 'Plank', 'Crunches'] },
];
function presetThumb(p) { const e = presetExercises(p)[0]; return e ? `<img src="${esc(imgOf(e))}" alt="" loading="lazy" onerror="this.remove()">` : ''; }

// Vorlagen-Auswahl: ALLE Übungen der Muskelgruppe, Anzahl wählen oder einzeln abhaken
let psSheet = null; // { key, sel:Set(index) }
function presetAll(p) {
  const cur = presetExercises(p).slice(0, p.ex.length ? p.ex.filter(n => pool.some(e => e.name === n)).length : 0);
  const f = PRESET_FILL[p.key], out = cur.slice(), names = new Set(out.map(e => e.name));
  const lists = (f ? f[0] : []).map(m => pool.filter(e => e.muscle === m && e.category !== 'warmup' && !names.has(e.name)).sort((a, b) => (isCompound(b.name) - isCompound(a.name)) || a.name.localeCompare(b.name)));
  for (let k = 0; lists.some(l => l.length > k); k++) for (const l of lists) if (l[k]) out.push({ name: l[k].name, muscle: l[k].muscle, gif: l[k].gif, sets: 3, note: '', unit: defaultUnit(l[k].name) });
  return out;
}
function psPick(n) { const p = PRESETS.find(x => x.key === psSheet.key); psSheet.sel = new Set(Array.from({ length: Math.min(n, presetAll(p).length) }, (_, i) => i)); }
function mountPresetSheet() {
  document.querySelectorAll('.ps-bg').forEach(n => n.remove());
  if (!psSheet) return;
  const p = PRESETS.find(x => x.key === psSheet.key); if (!p) return;
  const all = presetAll(p), n = psSheet.sel.size;
  const pill = c => `<button class="dt-chip${(c === 0 ? n === all.length : n === c) ? ' on' : ''}" data-act="psCount" data-v="${c}">${c || 'Alle ' + all.length}</button>`;
  content.insertAdjacentHTML('beforeend', `<div class="goal-sheet dt-bg ps-bg" data-act="psClose"><div class="dt-sheet ps-sheet">
    <div class="dt-body"><h2 class="dt-name">${esc(p.name)} · ${all.length} Übungen im Pool</h2>
      <div class="dt-sec">Wie viele?</div><div class="dt-add">${[5, 8, 10, 12].filter(c => c < all.length).map(pill).join('')}${pill(0)}</div>
      <div class="dt-sec">Oder einzeln wählen</div>
      <div class="ps-list">${all.map((e, i) => `<button class="ps-row${psSheet.sel.has(i) ? ' on' : ''}" data-act="psTog" data-i="${i}"><img src="${esc(imgOf(e))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><span><b>${esc(dn(e.name))}</b><em>${esc(MUSCLE_DE[e.muscle] || e.muscle)}</em></span><i>${psSheet.sel.has(i) ? '✓' : ''}</i></button>`).join('')}</div>
    </div>
    <div class="ps-bar"><button class="ov-btn ov-btn-ghost" data-act="psClose">Abbrechen</button><button class="ov-btn" data-act="psCreate"${n ? '' : ' disabled'}>Anlegen · ${n}</button></div>
  </div></div>`);
}
// Vorlagen: kuratierte Übungen zuerst, dann reihum mit passenden Pool-Übungen auf Zielanzahl aufgefüllt
const PRESET_FILL = { push: [['chest', 'shoulders', 'triceps'], 10], pull: [['lats', 'middle back', 'biceps', 'traps'], 10], legs: [['quadriceps', 'hamstrings', 'glutes', 'calves'], 10],
  back: [['lats', 'middle back', 'lower back', 'traps'], 8], chest: [['chest'], 8], shoulders: [['shoulders', 'traps'], 8], triceps: [['triceps'], 8], biceps: [['biceps', 'forearms'], 8], core: [['abdominals'], 8] };
const presetCache = {};
function presetExercises(p) {
  if (presetCache[p.key] && presetCache[p.key].n === pool.length) return presetCache[p.key].v;
  const mk = e => ({ name: e.name, muscle: e.muscle, gif: e.gif, sets: 3, note: '', unit: defaultUnit(e.name) });
  const out = p.ex.map(n => pool.find(e => e.name === n)).filter(Boolean);
  const f = PRESET_FILL[p.key];
  if (f) {
    const bad = /machine|lever|smith|sled|bosu|ball|medicine|chain|stability|sandbag|tire|log |axle|atlas|stretch|rotation|jump|kneeling|plyo|jefferson|zercher|guillotine|deadlift|snatch|clean|jerk|behind (the )?neck|weighted|one-arm|single/i;
    const lists = f[0].map(m => pool.filter(e => e.muscle === m && e.category !== 'warmup' && !bad.test(e.name) && !out.includes(e)).sort((a, b) => (isCompound(b.name) - isCompound(a.name)) || a.name.localeCompare(b.name)));
    for (let k = 0; out.length < f[1] && lists.some(l => l.length > k); k++) for (const l of lists) if (l[k] && out.length < f[1]) out.push(l[k]);
  }
  const v = out.map(mk); presetCache[p.key] = { n: pool.length, v }; return v;
}

// ---- V13 W-02: Auto-Trainingsgenerator (Regeln: Coach-Bericht) ----
const GENKEY = 'heimtraining.genlast';
let genJust = false, genFrom = null;
const GEAR = [['barbell', 'Langhantel'], ['dumbbell', 'Kurzhanteln'], ['cable', 'Seilzug'], ['band', 'Bänder'], ['rig', 'Klimmzug'], ['ext', 'Extension'], ['bench', 'Hantelbank'], ['body', 'Körper']];
const GEARKEY = 'heimtraining.gear2';
function loadGear() { try { const g = JSON.parse(localStorage.getItem(GEARKEY)); if (Array.isArray(g)) return g; } catch (e) {} return GEAR.map(x => x[0]); }
function isBack(e) { return e.muscle === 'lats' || e.muscle === 'middle back' || (e.muscle === 'lower back' && gearOf(e.name).includes('ext')); }
function gearOf(name) { // Liste der benötigten Geräte
  if (gearFix[name]) return gearFix[name].g;
  const n = name.toLowerCase(), r = [];
  if (/hyperext|back extension/.test(n)) return /no hyperextension bench/.test(n) ? ['body'] : ['ext'];
  if (/pull-?up|chin-?up|\bdips?\b|inverted row|hanging|muscle.up/.test(n) && !/bench dip/.test(n)) r.push('rig');
  if (/long bar|t-bar|\bez.?bar|\bez-curl/.test(n)) r.push('barbell'); else for (const k of ['barbell', 'dumbbell', 'cable', 'band']) if (matchesEquip(n, k)) { r.push(k); break; }
  if (!r.includes('cable') && /pushdown|pulldown|face pull|pull.?through/.test(n) && !/band/.test(n)) r.push('cable');
  if (/kettlebell/.test(n)) r.push('kb');
  if (r.includes('cable') && (/low|seated|row|lying|incline|bench|kickback|deadlift|hip |preacher|press|flye|shrug|upright|front|wrist|judo|iron cross|squat|lift|lateral|one.?legged/.test(n) || (/curl/.test(n) && !/high|overhead/.test(n)))) r.push('lowpulley'); // Seilzug nur von oben
  if (/bench|incline|decline|lying|preacher|skull|flyes|one-arm dumbbell row|pullover/.test(n) && !/hyperext/.test(n)) r.push('bench');
  return r.length ? r : ['body'];
}
function newGenCfg() { return { lv: null, goal: 'aufbau', dur: 30, count: null, groups: [], gear: loadGear(), minSets: 0, minReps: 0 }; }
let genCfg = newGenCfg(), genRes = null;
const GRANK = { Beine: 3, Rücken: 3, Brust: 3, Schultern: 2, Arme: 1, Bauch: 0 };
const MORDER = ['quadriceps', 'hamstrings', 'glutes', 'chest', 'lats', 'middle back', 'lower back', 'shoulders', 'traps', 'biceps', 'triceps', 'forearms', 'calves', 'abdominals'];
const GCOUNT = { 20: [2, 3, 4], 30: [3, 4, 5], 45: [4, 5, 6], 60: [5, 7, 8], 90: [7, 9, 11] }, GISO = { 20: 1, 30: 1, 45: 2, 60: 3, 90: 4 };
function genLevel() { return genCfg.lv != null ? genCfg.lv : (loadProfile().level != null ? loadProfile().level : 0); }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// ---- Aufwärmen: 2 passende Übungen vorne in jedem Training ----
const WARM = {
  Brust: ['Arm Swings (Chest Opener)', 'Scapular Push-Up', 'Arm Circles'],
  Rücken: ['Cat-Cow', 'Open Book', 'Shoulder Rolls', 'Superman'],
  Schultern: ['Arm Circles', 'Shoulder Rolls', 'Seated Front Deltoid'],
  Arme: ['Arm Circles', 'Wrist Circles', 'Overhead Triceps'],
  Bauch: ['Cat-Cow', 'Dead Bug', 'Toe Touchers'],
  Beine: ['Bodyweight Squat', 'Leg Swings', 'Glute Bridge (Warm-Up)', 'Standing Hip Circles', 'Inchworm']
};
const WARM_SEK = ['Seated Front Deltoid', 'Overhead Triceps', 'Superman'];
function mkWarm(name) {
  const e = pool.find(x => x.name === name); if (!e) return null;
  const sek = WARM_SEK.includes(name), r = sek ? 30 : 12;
  return { name: e.name, muscle: e.muscle, gif: e.gif, sets: 2, note: '', unit: sek ? 'sek' : 'wdh', plan: [{ w: null, r }, { w: null, r }], warm: true };
}
function warmupsFor(exs, skip) {
  const cnt = {}; (exs || []).filter(e => !e.warm).forEach(e => { const g = MUSCLE_GROUPS[e.muscle]; if (WARM[g]) cnt[g] = (cnt[g] || 0) + 1; });
  const gs = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]); if (!gs.length) return [];
  const used = new Set((skip || []).concat((exs || []).map(e => e.name))), lists = gs.map(g => shuffle(WARM[g]).filter(n => !used.has(n))), out = [];
  for (let k = 0; out.length < 2 && lists.some(l => l.length > k); k++) for (const l of lists) { const w = l[k] && !out.some(o => o.name === l[k]) && mkWarm(l[k]); if (w && out.length < 2) out.push(w); }
  return out;
}
function warmAlt(old, list) {
  const g = MUSCLE_GROUPS[old.muscle], names = list.map(x => x.name), free = n => !names.includes(n);
  const own = shuffle((WARM[g] || []).filter(free)), other = shuffle([].concat(...Object.values(WARM)).filter(free));
  return mkWarm((own[0] || other[0]) || '');
}
function isCompound(n) { n = n.toLowerCase(); return !/pullover|pushdown|fly|flye|raise|curl|extension|kickback|shrug/.test(n) && /press|squat|deadlift|row|pull-?up|pulldown|lunge|dip|chin|push-?up/.test(n); }
const SPOTS = ['lower back', 'lats', 'middle back', 'traps', 'neck', 'glutes', 'hamstrings', 'quadriceps', 'calves', 'biceps', 'triceps', 'forearms', 'abductors', 'adductors'];
const spotGrp = m => MUSCLE_GROUPS[m] === 'Sonstiges' ? 'Schultern' : MUSCLE_GROUPS[m];
const grpOn = m => genCfg.groups.includes(m);
const grpLabel = g => g.startsWith('m:') ? (MUSCLE_DE[g.slice(2)] || g.slice(2)) : g;
// Welche Geräte sind für den gewählten Fokus überhaupt nützlich? (Anzahl passender Übungen je Gerät)
function groupCounts() {
  // Wie gearCounts, umgekehrt: pro Muskelgruppe Anzahl Übungen, die mit den gewählten Geräten gehen
  const lv = genLevel(), out = {}, sel = genCfg.gear || [];
  const bad = /machine|lever|smith|sled|bosu|ball|medicine|chain|stability|sandbag|tire|log |axle|atlas|stretch|rotation|jump|kneeling|plyo|jefferson|zercher|guillotine/i;
  const hard = /deadlift|rack pull|clean|snatch|jerk|weighted|good morning|behind (the )?neck|guillotine|zercher|jefferson|overhead squat|olympic|sissy|muscle.up|atlas|pistol|single-arm push/i;
  pool.forEach(e => {
    if (bad.test(e.name) || (gearFix[e.name] && gearFix[e.name].s === 'no') || !MUSCLE_GROUPS[e.muscle] || (lv === 0 && hard.test(e.name))) return;
    if (sel.length && !gearOf(e.name).some(k => sel.includes(k))) return;
    const g = MUSCLE_GROUPS[e.muscle];
    out[g] = (out[g] || 0) + 1;
  });
  return out;
}
function gearCounts() {
  const g = genCfg.groups, lv = genLevel(), out = {};
  const bad = /machine|lever|smith|sled|bosu|ball|medicine|chain|stability|sandbag|tire|log |axle|atlas|stretch|rotation|jump|kneeling|plyo|jefferson|zercher|guillotine/i;
  const hard = /deadlift|rack pull|clean|snatch|jerk|weighted|good morning|behind (the )?neck|guillotine|zercher|jefferson|overhead squat|olympic|sissy|muscle.up|atlas|pistol|single-arm push/i;
  const core = (e, grp) => grp.startsWith('m:') ? e.muscle === grp.slice(2) : MUSCLE_GROUPS[e.muscle] === grp && (grp !== 'Rücken' || isBack(e));
  pool.forEach(e => {
    if (bad.test(e.name) || (gearFix[e.name] && gearFix[e.name].s === 'no') || !MUSCLE_GROUPS[e.muscle] || (lv === 0 && hard.test(e.name))) return;
    if (!g.some(x => core(e, x))) return;
    gearOf(e.name).forEach(k => { out[k] = (out[k] || 0) + 1; });
  });
  return out;
}
function genBase(lv, anyGear) {
  const bad = /machine|lever|smith|sled|bosu|ball|medicine|chain|stability|sandbag|tire|log |axle|atlas|stretch|rotation|jump|kneeling|plyo|jefferson|zercher|guillotine/i;
  const hard = /deadlift|rack pull|clean|snatch|jerk|weighted|good morning|behind (the )?neck|guillotine|zercher|jefferson|overhead squat|olympic|sissy|muscle.up|atlas|pistol|single-arm push/i;
  return pool.filter(e => e.category !== 'warmup' && !bad.test(e.name) && !(gearFix[e.name] && gearFix[e.name].s === 'no') && MUSCLE_GROUPS[e.muscle] && (lv > 0 || !hard.test(e.name)) && (anyGear || gearOf(e.name).every(k => genCfg.gear.includes(k))));
}
// Gewählte Muskelgruppe ohne passende Übung mit den gewählten Geräten: fehlende Geräte (z. B. Bank) automatisch dazuschalten
function autoGear() {
  const lv = genLevel(), sel = genCfg.gear || [], added = [];
  if (!sel.length) return added;
  genCfg.groups.filter(m => !m.startsWith('m:')).forEach(grp => {
    const cur = genCfg.gear;
    const c = genBase(lv, true).filter(e => MUSCLE_GROUPS[e.muscle] === grp && (grp !== 'Rücken' || isBack(e)));
    if (c.some(e => gearOf(e.name).every(k => cur.includes(k)))) return;
    let best = null;
    c.forEach(e => { const g = gearOf(e.name), miss = g.filter(k => !cur.includes(k)); if (g.some(k => cur.includes(k)) && (!best || miss.length < best.length)) best = miss; });
    if (best && best.length) { best.forEach(k => { cur.push(k); added.push(k); }); }
  });
  if (added.length) { genCfg.gear = genCfg.gear.slice(); try { localStorage.setItem(GEARKEY, JSON.stringify(genCfg.gear)); } catch (e2) {} }
  genCfg.autoAdded = added; return added;
}
// Wisch-Tausch: Übung i raus, passende neue (gleiche Gruppe, Geräte ok, nicht schon drin) rückt nach
function genSwap(i) {
  const old = genRes && genRes[i]; if (!old) return;
  if (old.warm) { const w = warmAlt(old, genRes); if (w) { genRes[i] = w; genSwapped = i; } return; }
  const lv = genLevel(), grp = MUSCLE_GROUPS[old.muscle], inList = genRes.map(x => x.name);
  const ok = e => MUSCLE_GROUPS[e.muscle] === grp && !inList.includes(e.name);
  let c = genBase(lv).filter(e => ok(e) && e.muscle === old.muscle);
  if (grp === 'Rücken' || !c.length) c = genBase(lv).filter(ok);
  if (!c.length) return;
  const same = c.filter(e => isCompound(e.name) === isCompound(old.name));
  const e = shuffle(same.length ? same : c)[0];
  const ex = { name: e.name, muscle: e.muscle, gif: e.gif, sets: 3, note: '', unit: defaultUnit(e.name) };
  const r = suggestEx(ex, lv, genCfg.goal); ex.sets = Math.max(r.sets, genCfg.minSets || 0);
  const reps = ex.unit === 'sek' ? r.reps : Math.max(r.reps, genCfg.minReps || 0);
  ex.plan = Array.from({ length: ex.sets }, () => ({ w: r.w, r: reps }));
  genRes[i] = ex; genSwapped = i;
}
let genSwapped = -1, genPick = -1;
const FAVKEY = 'heimtraining.favs';
function loadFavs() { try { const f = JSON.parse(localStorage.getItem(FAVKEY)); if (Array.isArray(f)) return f; } catch (e) {} return []; }
function genFav(i) { const e = genRes && genRes[i]; if (!e) return; const f = loadFavs(), k = f.indexOf(e.name); if (k >= 0) f.splice(k, 1); else f.push(e.name); try { localStorage.setItem(FAVKEY, JSON.stringify(f)); } catch (x) {} }
function wFavEx(t, i) { const e = t && t.exercises[i]; if (!e) return; const f = loadFavs(), k = f.indexOf(e.name); if (k >= 0) f.splice(k, 1); else f.push(e.name); try { localStorage.setItem(FAVKEY, JSON.stringify(f)); } catch (e2) {} }
// Wisch-Tausch im gespeicherten Training: gleiche Muskelgruppe, deine Geräte, nicht schon drin
function wSwapEx(t, i) {
  const old = t && t.exercises[i]; if (!old) return;
  if (old.warm) { const w = warmAlt(old, t.exercises); if (w) { t.exercises[i] = w; saveWeekplan(); } return; }
  const keep = genCfg.gear; genCfg.gear = loadGear();
  const lv = genLevel(), grp = MUSCLE_GROUPS[old.muscle], inList = t.exercises.map(x => x.name);
  const ok = e => MUSCLE_GROUPS[e.muscle] === grp && !inList.includes(e.name);
  let c = genBase(lv).filter(e => ok(e) && e.muscle === old.muscle);
  if (grp === 'Rücken' || !c.length) c = genBase(lv).filter(ok);
  genCfg.gear = keep;
  if (!c.length) return;
  const same = c.filter(e => isCompound(e.name) === isCompound(old.name));
  const e = shuffle(same.length ? same : c)[0];
  const ex = { name: e.name, muscle: e.muscle, gif: e.gif, sets: old.sets || 3, note: '', unit: defaultUnit(e.name) };
  const r = suggestEx(ex, lv, genCfg.goal);
  ex.plan = Array.from({ length: ex.sets }, () => ({ w: r.w, r: r.reps }));
  t.exercises[i] = ex; saveWeekplan();
}
function genPickSet(name) {
  const e = pool.find(x => x.name === name); if (!e || genPick < 0 || !genRes[genPick]) { genPick = -1; return; }
  const lv = genLevel(), ex = { name: e.name, muscle: e.muscle, gif: e.gif, sets: 3, note: '', unit: defaultUnit(e.name) };
  const r = suggestEx(ex, lv, genCfg.goal); ex.sets = Math.max(r.sets, genCfg.minSets || 0);
  const reps = ex.unit === 'sek' ? r.reps : Math.max(r.reps, genCfg.minReps || 0);
  ex.plan = Array.from({ length: ex.sets }, () => ({ w: r.w, r: reps }));
  genRes[genPick] = ex; genSwapped = genPick; genPick = -1;
}
function genPickHtml() {
  const old = genRes[genPick], lv = genLevel(), inList = genRes.map(x => x.name), fav = loadFavs();
  const c = genBase(lv).filter(e => !inList.includes(e.name)).sort((a, b) => (MUSCLE_GROUPS[b.muscle] === MUSCLE_GROUPS[old.muscle]) - (MUSCLE_GROUPS[a.muscle] === MUSCLE_GROUPS[old.muscle]) || (fav.includes(b.name) - fav.includes(a.name)) || a.name.localeCompare(b.name));
  return `<div class="gp-ov"><div class="gp-h"><b>Übung ersetzen</b><button class="gp-x" data-act="genPickClose">✕ Abbrechen</button></div><input id="gp-q" class="gp-q" type="search" placeholder="Suchen…" autocomplete="off"><div class="gp-list">${c.map(e => `<button class="gp-r" data-act="genPickDo" data-name="${esc(e.name)}" data-q="${esc(e.name.toLowerCase())}"><img src="${esc(imgOf(e))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><span><b>${fav.includes(e.name) ? '★ ' : ''}${esc(dn(e.name))}</b><em>${esc(MUSCLE_DE[e.muscle] || e.muscle)}</em></span></button>`).join('')}</div><button class="gp-cancel" data-act="genPickClose">ABBRECHEN</button></div>`;
}
let genNote = '';
function generate() {
  genNote = '';
  const lv = genLevel(), g = genCfg.groups.length ? genCfg.groups : ['Brust'];
  let last = []; try { last = JSON.parse(localStorage.getItem(GENKEY)) || []; } catch (e) {}
  const bad = /machine|lever|smith|sled|bosu|ball|medicine|chain|stability|sandbag|tire|log |axle|atlas|stretch|rotation|jump|kneeling|plyo|jefferson|zercher|guillotine/i;
  const hard = /deadlift|rack pull|clean|snatch|jerk|weighted|good morning|behind (the )?neck|guillotine|zercher|jefferson|overhead squat|olympic|sissy|muscle.up|atlas|pistol|single-arm push/i;
  const base = genBase(lv);
  const n = genCfg.count || GCOUNT[genCfg.dur][lv], isoMax = genCfg.count ? Math.ceil(n / 2) : GISO[genCfg.dur];
  const gs = g.slice().sort((a, b) => (b.startsWith('m:') - a.startsWith('m:')) || ((GRANK[b] || 0) - (GRANK[a] || 0))); // spezielle Muskeln zuerst, damit sie sicher drin sind
  const nSp = gs.filter(x => x.startsWith('m:')).length, nGr = gs.length - nSp;
  let per;
  if (nSp && nGr && n > nSp) { // Hauptgruppen bekommen den Löwenanteil, jeder spezielle Muskel genau 1 Übung (zusätzlich)
    const rest = n - nSp, gsOnly = gs.filter(x => !x.startsWith('m:')); let gi2 = 0;
    per = gs.map(x => x.startsWith('m:') ? 1 : (Math.floor(rest / nGr) + (gi2++ < rest % nGr ? 1 : 0)));
  } else per = gs.map((_, i) => Math.floor(n / gs.length) + (i < n % gs.length ? 1 : 0));
  const picked = []; let isoUsed = 0;
  gs.forEach((grp, gi) => {
    const core = e => grp.startsWith('m:') ? e.muscle === grp.slice(2) : MUSCLE_GROUPS[e.muscle] === grp && (grp !== 'Rücken' || (isBack(e) && !/pushdown/i.test(e.name)));
    let cand = shuffle(base.filter(e => core(e) && !last.includes(e.name) && !picked.includes(e)));
    if (cand.length < per[gi]) cand = shuffle(base.filter(e => core(e) && !picked.includes(e)));
    if (grp === 'Arme') { // Bizeps/Trizeps abwechselnd
      const bi = cand.filter(e => e.muscle === 'biceps'), tri = cand.filter(e => e.muscle === 'triceps'), rest = cand.filter(e => e.muscle === 'forearms');
      const mix = []; for (let k = 0; k < Math.max(bi.length, tri.length); k++) { if (bi[k]) mix.push(bi[k]); if (tri[k]) mix.push(tri[k]); } cand = mix.concat(rest);
    }
    const comps = cand.filter(e => isCompound(e.name)), isos = cand.filter(e => !isCompound(e.name));
    let take = [];
    const wantComp = grp === 'Arme' || grp === 'Bauch' ? 0 : Math.max(1, per[gi] - Math.max(1, Math.round(isoMax / gs.length)));
    take = take.concat(comps.slice(0, Math.min(wantComp, per[gi])));
    for (const e of isos) { if (take.length >= per[gi]) break; if (isoUsed < isoMax || grp === 'Arme' || grp === 'Bauch') { take.push(e); isoUsed++; } }
    for (const e of comps.slice(take.length)) { if (take.length >= per[gi]) break; if (!take.includes(e)) take.push(e); }
    for (const e of cand) { if (take.length >= per[gi]) break; if (!take.includes(e)) take.push(e); }
    picked.push(...take);
  });
  // Auffüllen: wenn eine Gruppe mit den gewählten Geräten zu wenig Übungen hat, fehlende Plätze reihum aus den anderen Gruppen holen (gewünschte Anzahl einhalten)
  if (genCfg.count && picked.length < n) {
    const coreOf = grp => e => grp.startsWith('m:') ? e.muscle === grp.slice(2) : MUSCLE_GROUPS[e.muscle] === grp && (grp !== 'Rücken' || isBack(e));
    const rest = gs.map(grp => shuffle(base.filter(e => coreOf(grp)(e) && !picked.includes(e))));
    for (let k = 0; picked.length < n && rest.some(r => r.length); k++) { const r = rest[k % rest.length]; const e = r.shift(); if (e && !picked.includes(e)) picked.push(e); }
  }
  picked.sort((a, b) => (isCompound(b.name) - isCompound(a.name)) || ((GRANK[MUSCLE_GROUPS[b.muscle]] || 0) - (GRANK[MUSCLE_GROUPS[a.muscle]] || 0)) || (MORDER.indexOf(a.muscle) - MORDER.indexOf(b.muscle)));
  const exs = picked.map(e => ({ name: e.name, muscle: e.muscle, gif: e.gif, sets: 3, note: '', unit: defaultUnit(e.name) }));
  exs.forEach(ex => { const r = suggestEx(ex, lv, genCfg.goal); ex.sets = Math.max(r.sets, genCfg.minSets || 0); const reps = ex.unit === 'sek' ? r.reps : Math.max(r.reps, genCfg.minReps || 0); ex.plan = Array.from({ length: ex.sets }, () => ({ w: r.w, r: reps })); });
  if (!exs.length) { genRes = []; genJust = true; return; }
  exs.unshift(...warmupsFor(exs));
  try { localStorage.setItem(GENKEY, JSON.stringify(picked.map(e => e.name).concat(last).slice(0, 24))); } catch (e) {}
  genRes = exs; genJust = true; genSwapped = -1;
}
// ---- Nächstes Training berechnen: Drücken / Ziehen / Beine rotieren, Pause je Muster + einfache Steigerung ----
const isWarmName = n => { const e = pool.find(x => x.name === n); return !!(e && e.category === 'warmup'); };
function nextPlan() {
  // Ganzkörper über die Woche, aber pro Training nur 3 Gruppen: die am längsten nicht trainierten, mit Drücken+Ziehen im Gleichgewicht
  const last = {}, now = today();
  loadHistory().forEach(r => (r.exercises || []).forEach(e => { if (!(e.setsDone > 0) || e.warm || isWarmName(e.name)) return; const g = MUSCLE_GROUPS[e.muscle]; if (g && g !== 'Sonstiges' && (!last[g] || r.date > last[g])) last[g] = r.date; }));
  const days = g => last[g] ? Math.round((new Date(now + 'T12:00:00') - new Date(last[g] + 'T12:00:00')) / 864e5) : 999;
  const byRest = l => l.slice().sort((x, y) => days(y) - days(x) || (GRANK[y] || 0) - (GRANK[x] || 0));
  const rested = l => { const r = l.filter(g => days(g) >= 2); return r.length >= 2 ? r : l; };
  const push = g => g === 'Brust' || g === 'Schultern';
  let mains = byRest(rested(['Beine', 'Rücken', 'Brust', 'Schultern'])).slice(0, 2);
  if (mains.every(push)) mains[1] = byRest(['Beine', 'Rücken'])[0]; // nie nur Drücken
  const minor = byRest(['Arme', 'Bauch'].filter(g => days(g) >= 1).length ? ['Arme', 'Bauch'].filter(g => days(g) >= 1) : ['Arme', 'Bauch'])[0];
  const pick = mains.concat(minor);
  const txt = g => last[g] ? `${g} ${days(g) === 0 ? 'heute' : days(g) === 1 ? 'gestern' : 'vor ' + days(g) + ' Tagen'}` : `${g} noch nie`;
  return { key: 'mix', label: 'Ganzkörper-Mix', groups: pick, info: pick.join(' · '), note: 'Am längsten nicht dran: ' + pick.map(txt).join(', ') + '.' };
}
function applyProgression(exs) {
  // Steigern erst, wenn die Übung 2× hintereinander komplett (alle Sätze) mit demselben Gewicht geschafft wurde
  const h = loadHistory();
  exs.forEach(ex => {
    if (ex.warm || (ex.unit || 'kg') !== 'kg') return;
    const recs = h.map(r => (r.exercises || []).find(e => e.name === ex.name && (e.weights || []).some(w => w != null))).filter(Boolean).slice(0, 2);
    if (!recs.length) return;
    const top = e => Math.max(...e.weights.filter(w => w != null)), done = e => e.setsDone >= e.setsTotal;
    const w0 = top(recs[0]), step = /dumbbell|kettlebell/i.test(ex.name) ? 2 : 2.5;
    const up = recs.length === 2 && recs.every(done) && top(recs[1]) === w0;
    const w = up ? w0 + step : w0; ex.up = up; (ex.plan || []).forEach(p => { p.w = w; });
  });
}
function genSave(start) {
  if (!genRes || !genRes.length) return;
  const g = genCfg.groups.length ? genCfg.groups : ['Brust'], lv = genLevel();
  const t = { id: 'w' + Date.now(), name: loserName(), exercises: genRes, weekdays: [], since: {}, time: '', level: lv, goal: genCfg.goal, auto: true };
  weekplan.push(t); saveWeekplan(); genRes = null;
  if (start) playStart(t.id); else { trTab = 'act'; view = 'trainings'; }
}
const SPK = '<svg class="qk-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.1 6.4 6.4 2.1-6.4 2.1L12 19.5l-2.1-6.4L3.5 11l6.4-2.1z"/></svg>';
function genHero() {
  const ex = genRes || [], sets = ex.reduce((n, e) => n + (e.sets || 0), 0), gs = [...new Set(ex.filter(e => !e.warm).map(e => MUSCLE_GROUPS[e.muscle]).filter(Boolean))];
  const t = (n, l, i) => `<div class="gh-t" style="--i:${i}"><b>${n}</b><em>${l}</em></div>`;
  return `<div class="gh"><div class="gh-top">Heute: ${gs.map(g => `<span class="gx-t g" data-g="${esc(g)}">${esc(g)}</span>`).join('')}</div><div class="gh-row">${t(ex.length, 'Übungen', 0)}${t(sets, 'Sätze', 1)}${t('~' + genCfg.dur, 'Minuten', 2)}</div></div>`;
}
function renderGen() {
  const lv = genLevel(), p = loadProfile();
  const pill = (act, v, l, on) => `<button class="lv-p${on ? ' on' : ''}" data-act="${act}" data-v="${v}">${l}</button>`;
  const res = genRes && !genRes.length ? `<div class="gn-res"><div class="lv-note">Mit diesen Geräten und diesem Fokus finde ich keine Übungen. Mehr Geräte oder anderen Fokus wählen.</div></div>` : genRes ? `<div class="gn-res">${genHero()}${genNote ? `<div class="lv-note">${esc(genNote)}</div>` : ''}${genRes.map((e, i) => `<div class="gn-sw" data-gsw="${i}"><div class="gn-sw-bg"><span>★ Favorit</span><span>Neue Übung ↻</span></div><div class="gn-ex exinfo${i === genSwapped ? ' gn-new' : ''}${e.warm ? ' warm' : ''}" data-g="${esc(MUSCLE_GROUPS[e.muscle] || '')}" style="--i:${i}" data-act="exInfo" data-name="${esc(e.name)}"><span class="pv-n">${i + 1}</span><img src="${esc(imgOf(e))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
      <div class="gx"><b>${loadFavs().includes(e.name) ? '★ ' : ''}${esc(dn(e.name))}</b><div class="gx-m">${e.warm ? '<span class="gx-t warm">Aufwärmen</span>' : ''}<span class="gx-t g">${esc(MUSCLE_DE[e.muscle] || e.muscle)}</span><span class="gx-t">${e.sets} × ${e.plan[0].r} ${e.unit === 'sek' ? 'Sek' : 'Wdh'}</span>${e.plan[0].w != null && e.unit === 'kg' ? `<span class="gx-t w">${e.up ? '↑ ' : 'ca. '}${e.plan[0].w} kg</span>` : ''}</div></div><button class="gn-pk" data-act="genPickOpen" data-i="${i}" aria-label="Übung wählen">⇄</button></div></div>`).join('')}
      <div class="lv-note">Rechts wischen = ★ Favorit, links = neue Übung, ⇄ = selbst wählen. Vorschlag mit ca.-Werten. Technik vor Gewicht, bei Schmerzen abbrechen.${!p.weight && genRes.some(e => e.unit === 'kg') ? ' Gewicht im Profil eintragen, dann kommen auch kg-Vorschläge.' : ''}</div>
      <div class="gn-btns"><button class="ts-save" data-act="genSave">✓ SPEICHERN</button><button class="pl-next ts-go" data-act="genGo">▶ SPEICHERN &amp; STARTEN</button><button class="ts-add" data-act="genDo">⟳ Neu mischen</button></div></div>` : '';
  const scrollRes = genJust; genJust = false;
  content.innerHTML = `<div class="gn">
    ${genRes ? '' : `<div class="qk">
      <div class="qk-sec" style="margin-top:0">Spezielle Muskeln hinzufügen</div><div class="qk-spots">${SPOTS.map(m => `<button class="qk-p${genCfg.groups.includes('m:' + m) ? ' on' : ''}" data-act="genGrp" data-v="m:${m}">${MUSCLE_DE[m] || m}</button>`).join('')}</div>
      <button class="qk-go" data-act="genBack">FERTIG</button>
    </div>`}
    ${res}
  </div>`;
  if (scrollRes) setTimeout(() => { const r = document.querySelector('.gn-res'); if (r) r.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
}
// Live-Vorschau: welche Übungen passen zu den gewählten Geräten + Muskeln; keine = Lücke fürs nächste Bild-Batch
function prevHtml() {
  const gr = genCfg.groups.filter(m => !m.startsWith('m:')); if (!gr.length || !genCfg.gear.length) return '';
  const lv = genLevel(), list = genBase(lv).filter(e => gr.some(g => MUSCLE_GROUPS[e.muscle] === g && (g !== 'Rücken' || isBack(e))));
  if (!list.length) { try { const k = 'heimtraining.gaps', o = JSON.parse(localStorage.getItem(k)) || {}; o[gr.join('+') + ' | ' + genCfg.gear.join('+')] = 1; localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} return '<div class="qk-prev none">Dafür gibt es noch keine Übung – kommt beim nächsten Bilder-Durchlauf dazu.</div>'; }
  const nm = list.slice(0, 3).map(e => esc(dn(e.name))).join(', ');
  return `<div class="qk-prev"><b>${list.length} Übungen</b> passen · ${nm} …</div>`;
}
function builderHtml(full) {
  // Gemeinsamer Baukasten für Planung (kompakt) und Einstellungsseite (full = + Körperstelle, Level, Ziel)
  const qp = (act, v, l, on, none) => `<button class="qk-p${on ? ' on' : ''}${none && !on ? ' none' : ''}" data-act="${act}" data-v="${v}">${l}</button>`;
  const segRow = (l, a, vs, cur, f) => `<div class="qk-r${l ? '' : ' qk-r1'}">${l ? `<span>${l}</span>` : ''}<div class="seg" style="--n:${vs.length}">${vs.map(v => `<button class="${cur === v ? 'on' : ''}" data-act="${a}" data-v="${v}">${f(v)}</button>`).join('')}</div></div>`;
  const gc = null;
  const gearBtns = GEAR.map(([k, l0]) => { const l = l0 === 'Kurzhanteln' ? 'Hanteln' : l0 === 'Hantelbank' ? 'Bank' : l0; return `<button class="qk-p${genCfg.gear.includes(k) ? ' on' : ''}${(genCfg.autoAdded || []).includes(k) ? ' auto' : ''}${gc && k !== 'body' && !gc[k] ? ' none' : ''}" data-act="genGear" data-v="${k}">${l}</button>`; }).join('');
  const gcn = groupCounts();
  let h = `${segRow('', 'genDur', [20, 30, 45, 60], genCfg.dur, v => v + ' Min')}
      <div class="qk-gear">${gearBtns}</div>
      <div class="qk-grid3">${MUSCLE_GROUP_LIST.map(m => qp('genGrp', m, m, grpOn(m), !genCfg.gear.length || !gcn[m])).join('')}</div>`;
  h += prevHtml();
  if (full) h += `
      <div class="qk-sec">Spezielle Muskeln hinzufügen</div><div class="qk-spots">${SPOTS.map(m => qp('genGrp', 'm:' + m, MUSCLE_DE[m] || m, genCfg.groups.includes('m:' + m))).join('')}</div>`;
  h += `
      <div class="qk-rows${genCfg.groups.length ? '' : ' dim'}">${segRow('Übungen', 'genCnt', [0, 3, 4, 5, 6, 8], genCfg.count || 0, v => v || 'Auto')}${segRow('Sätze', 'genMinS', [0, 3, 4, 5], genCfg.minSets, v => v || 'Auto')}${segRow('Wdh', 'genMinR', [0, 8, 10, 12, 15], genCfg.minReps, v => v || 'Auto')}</div>`;
  return h;
}
// ---- Planung als Sprung-Wizard: Zeit -> Geräte -> Fokus, je Schritt eine Frage ----
let plStep = 0, plClassic = false, plSeen = false, plSpots = false, plMsg = '';
const PL_N = 3, PL_TILES = ['Brust', 'Rücken', 'Schultern', 'm:biceps', 'm:triceps', 'Bauch', 'Beine'];
function plRail() {
  const gl = GEAR.filter(([k]) => genCfg.gear.includes(k)).map(([, l]) => l === 'Kurzhanteln' ? 'Hanteln' : l === 'Hantelbank' ? 'Bank' : l);
  const ans = [plStep > 0 ? genCfg.dur + ' Min' : '', plStep > 1 ? (gl.length ? (gl.length > 2 ? gl.slice(0, 2).join(' + ') + ' +' + (gl.length - 2) : gl.join(' + ')) : 'alle Geräte') : ''];
  return `<div class="pl-rail"><div class="pl-dots">${Array.from({ length: PL_N }, (_, i) => `<i class="${i < plStep ? 'done' : i === plStep ? 'cur' : ''}"></i>`).join('')}</div>
    <div class="pl-chips">${ans.map((a, i) => a ? `<button class="pl-chip" data-act="plTo" data-v="${i}">${esc(a)}</button>` : '').join('')}</div></div>`;
}
// Push/Pull-Trennung (Quelle: Fitness First Split-Training): Trizeps nur mit Brust/Schultern, Bizeps nur mit Rücken; Bizeps/Trizeps nie zusammen
function grpConflict(m, G) {
  const has = x => G.includes(x);
  if (m === 'm:biceps') return has('m:triceps') ? 'Trizeps' : has('Brust') ? 'Brust' : has('Schultern') ? 'Schultern' : '';
  if (m === 'm:triceps') return has('m:biceps') ? 'Bizeps' : has('Rücken') ? 'Rücken' : '';
  if (m === 'Brust' || m === 'Schultern') return has('m:biceps') ? 'Bizeps' : '';
  if (m === 'Rücken') return has('m:triceps') ? 'Trizeps' : '';
  return '';
}
function armPick(G) { // Bizeps/Trizeps im Wechsel: der länger nicht trainierte kommt dran
  const last = {}; loadHistory().forEach(r => (r.exercises || []).forEach(e => { if ((e.setsDone > 0) && !e.warm && (e.muscle === 'biceps' || e.muscle === 'triceps') && (!last[e.muscle] || r.date > last[e.muscle])) last[e.muscle] = r.date; }));
  const push = G.includes('Brust') || G.includes('Schultern'), pull = G.includes('Rücken');
  if (push && pull) return null; if (push) return 'm:triceps'; if (pull) return 'm:biceps';
  return (last.biceps || '') <= (last.triceps || '') ? 'm:biceps' : 'm:triceps';
}
function plJump(n) {
  const el = content.querySelector('.pl-step');
  const go = () => { plStep = Math.max(0, Math.min(PL_N - 1, n)); render(); };
  if (!el) return go();
  el.classList.add('out'); setTimeout(go, 200);
}
function renderStart() {
  if (plClassic) return renderStartClassic();
  if (window._lv !== 'start' || !plSeen) { plStep = 0; }
  plSeen = true;
  const SP = '<svg class="qk-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.1 6.4 6.4 2.1-6.4 2.1L12 19.5l-2.1-6.4L3.5 11l6.4-2.1z"/></svg>';
  let body = '', foot = '';
  if (plStep === 0) {
    body = `<h2 class="pl-q">Wie lange?</h2><div class="pl-big">${[20, 30, 45, 60].map((v, i) => `<button class="pl-opt${genCfg.dur === v ? ' on' : ''}" style="--i:${i}" data-act="plDur" data-v="${v}"><b>${v}</b><em>Min</em></button>`).join('')}</div>`;
  } else if (plStep === 1) {
    const gearBtns = GEAR.map(([k, l0], i) => { const l = l0 === 'Kurzhanteln' ? 'Hanteln' : l0 === 'Hantelbank' ? 'Bank' : l0; return `<button class="pl-opt sm${genCfg.gear.includes(k) ? ' on' : ''}" style="--i:${i}" data-act="genGear" data-v="${k}">${l}</button>`; }).join('');
    body = `<h2 class="pl-q">Was baust du auf?</h2><div class="pl-grid">${gearBtns}</div><div class="pl-sub">${genCfg.gear.length ? '' : 'Nichts gewählt = alle Geräte'}</div>`;
    foot = `<button class="qk-go" data-act="plNext">WEITER ›</button>`;
  } else {
    const np = nextPlan(), gcn = groupCounts();
    if (!genCfg.groups.some(m => !m.startsWith('m:')) && !genCfg.plAuto) { genCfg.groups = np.groups.filter(m => m !== 'Arme' && (!genCfg.gear.length || gcn[m])); if (np.groups.includes('Arme')) { const ap = armPick(genCfg.groups); if (ap) genCfg.groups.push(ap); } genCfg.plAuto = true; }
    const ago = g => { const t = np.note.match(new RegExp(g + ' ([^,.]+)')); return t ? t[1] : ''; };
    body = `<h2 class="pl-q">Was ist dran?</h2><div class="pl-sub${plMsg ? ' warn' : ''}">${plMsg ? esc(plMsg) : 'Vorgewählt: am längsten nicht trainiert · graue Kacheln tippen erklärt, warum'}</div><div class="pl-grid g3">${PL_TILES.map((m, i) => { const sp = m.startsWith('m:'), lb = sp ? (MUSCLE_DE[m.slice(2)] || m) : m, on = grpOn(m) || genCfg.groups.includes(m), blocked = !on && grpConflict(m, genCfg.groups), none = !sp && genCfg.gear.length && !gcn[m]; return `<button class="pl-opt sm${on ? ' on' : ''}${(none || blocked) && !on ? ' none' : ''}" style="--i:${i}" data-act="genGrp" data-v="${m}">${lb}<small>${blocked ? 'nicht mit ' + esc(blocked) : sp ? '' : esc(ago(m))}</small></button>`; }).join('')}</div>
      <button class="pl-more${plSpots || genCfg.groups.some(m => m.startsWith('m:')) ? ' open' : ''}" data-act="plSpots">${genCfg.groups.some(m => m.startsWith('m:')) ? '✓ Spezielle Muskeln' : '+ Spezielle Muskeln'}<small>${genCfg.groups.filter(m => m.startsWith('m:')).length ? genCfg.groups.filter(m => m.startsWith('m:')).map(m => MUSCLE_DE[m.slice(2)] || m.slice(2)).join(', ') : 'z. B. Nacken, Waden, Unterer Rücken'}</small></button>
      ${plSpots || genCfg.groups.some(m => m.startsWith('m:')) ? `<div class="pl-grid g3 spots">${SPOTS.filter(m => m !== 'biceps' && m !== 'triceps').map((m, i) => `<button class="pl-opt sm${genCfg.groups.includes('m:' + m) ? ' on' : ''}" style="--i:${i}" data-act="genGrp" data-v="m:${m}">${MUSCLE_DE[m] || m}</button>`).join('')}</div>` : ''}${prevHtml()}`;
    foot = `<button class="qk-go wander" data-act="genDo">${SP}TRAINING BAUEN</button>`;
  }
  plMsg = '';
  content.innerHTML = `<div class="sv"><div class="pl">${plRail()}<div class="pl-step" data-s="${plStep}">${body}</div><div class="pl-foot">${foot}</div>
    <button class="qk-link" data-act="plClassic">Alle Optionen auf einer Seite ›</button></div></div>`;
  content.classList.toggle('pl-scroll', plStep === 2 && !!(plSpots || genCfg.groups.some(m => m.startsWith('m:'))));
}
function renderStartClassic() {
  // Planung: eine Frage – "Was trainiere ich jetzt?". Gespeicherte Trainings = 1 Tipp bis ins Workout, darunter der Schnell-Bauer.
  const qp = (act, v, l, on, none) => `<button class="qk-p${on ? ' on' : ''}${none && !on ? ' none' : ''}" data-act="${act}" data-v="${v}">${l}</button>`;
  const own = weekplan.filter(w => w.exercises.length && !w.draft);
  const openT = own.find(w => startOf(w.id, today()) && !loadHistory().some(r => r.trainingId === w.id && r.date === today()));
  const row = t => `<button class="pl-row${openT && openT.id === t.id ? ' open' : ''}" data-act="quickStart" data-id="${t.id}">
      <span class="pl-row-t"><b>${esc(t.name)}</b>${shareHtml(t, 3)}</span>
      <span class="pl-row-n">${openT && openT.id === t.id ? 'WEITER' : t.exercises.length + ' Üb.'}</span><span class="pl-row-go" aria-hidden="true">▶</span></button>`;
  const SP = '<svg class="qk-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.1 6.4 6.4 2.1-6.4 2.1L12 19.5l-2.1-6.4L3.5 11l6.4-2.1z"/></svg>';
  content.innerHTML = `<div class="sv">
    <div class="qk">
      ${builderHtml(false)}
      <button class="qk-next" data-act="genNext"><b>➜ NÄCHSTES TRAINING</b><em>${esc(nextPlan().label)} · ${esc(nextPlan().info)}</em></button>
      <button class="qk-go wander${genCfg.groups.length ? '' : ' surp'}" data-act="genDo">${SP}${genCfg.groups.length ? 'TRAINING BAUEN' : 'ÜBERRASCH MICH'}</button>
    </div>
    <button class="qk-link" data-act="genOpen">Weitere Einstellungen${genCfg.groups.some(x => x.startsWith('m:')) ? ' · +' + genCfg.groups.filter(x => x.startsWith('m:')).map(grpLabel).join(', +') : ''} ›</button>
    </div>
  </div>`;
}

// Training beenden (Wochenplan-Ansicht und Player): Verlaufseintrag, Sync, Fortschritt zurücksetzen. Auch unvollständig erlaubt.
function finishTraining(t) {
  const wp = wProgRaw(), dOf = wp.done[t.id] || {};
  const exercises = t.exercises.map(ex => {
    const sets = dOf[ex.name] || [];
    return { name: ex.name, muscle: ex.muscle, warm: !!ex.warm, setsDone: sets.filter(s => s && s.done).length, setsTotal: ex.sets || 3,
      unit: ex.unit || 'kg', weights: (ex.unit || 'kg') === 'none' ? [] : sets.map(s => s && s.weight != null ? s.weight : null) };
  });
  const doneTotal = exercises.reduce((s2, x) => s2 + x.setsDone, 0);
  if (!doneTotal && !confirm('Kein Satz abgehakt – trotzdem als Training zählen?')) return null;
  const note = (wp.sessionNote || {})[t.id] || '';
  const startRec = startOf(t.id, today());
  const rawMin = startRec ? Math.max(1, Math.round((Date.now() - new Date(startRec.startedAt)) / 60000)) : null;
  const durationMin = rawMin == null ? null : Math.min(rawMin, doneTotal * 4 + 10); // vergessenes Beenden nicht ewig mitzählen
  const calories = computeCalories(exercises, durationMin);
  const rec = { date: today(), day: t.name, trainingId: t.id, exercises,
    totalSetsDone: doneTotal, totalSetsPlanned: exercises.reduce((s, x) => s + x.setsTotal, 0),
    finishedAt: new Date().toISOString(), durationMin, calories, note };
  syncSession(rec); pushHistory(rec);
  delete wp.done[t.id];
  if (wp.sessionNote) delete wp.sessionNote[t.id];
  saveWProg(wp);
  return rec;
}

// ---- Workout-Player: eine Übung pro Bildschirm, Sätze vorausgefüllt, Pausen-Timer ----
let playSelK = null, playTid = null, playIdx = 0, restEnd = 0, summaryRec = null;
const REST_SEC = 90; // Standard; im Profil einstellbar (Feld rest)
function restSec() { const r = loadProfile().rest; return r >= 15 && r <= 600 ? r : REST_SEC; }
function lastWeights(name) {
  const r = loadHistory().find(h => (h.exercises || []).some(e => e.name === name && (e.weights || []).some(w => w != null)));
  const e = r && r.exercises.find(x => x.name === name);
  return e ? e.weights.filter(w => w != null) : [];
}
function playStart(id) {
  const t = trainingById(id); if (!t) return;
  const dOf = wProgRaw().done[t.id] || {};
  const firstOpen = t.exercises.findIndex(ex => ((dOf[ex.name] || []).filter(x => x && x.done).length) < (ex.sets || 3));
  playTid = id; playIdx = firstOpen < 0 ? 0 : firstOpen; restEnd = 0; playT0 = Date.now(); playDrawer = false; playSelK = null; pushStart(id); view = 'play';
}
let playT0 = Date.now(), playDrawer = false;
function fmtT(sec) { sec = Math.max(0, sec); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), x = sec % 60; return (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(x).padStart(2, '0'); }
function renderPlay() {
  const t = trainingById(playTid);
  if (!t || !t.exercises.length) { view = 'start'; return renderStart(); }
  playIdx = Math.max(0, Math.min(playIdx, t.exercises.length - 1));
  const ex = t.exercises[playIdx], dOf = wProgRaw().done[t.id] || {}, sets = dOf[ex.name] || [];
  const n = ex.sets || 3, unit = ex.unit || 'kg', last = lastWeights(ex.name);
  const doneN = e => ((dOf[e.name] || []).filter(x => x && x.done).length);
  const firstOpen = Array.from({ length: n }, (_, k) => k).find(k => !(sets[k] || {}).done);
  const cur = Math.min(n - 1, playSelK != null ? playSelK : (firstOpen == null ? n - 1 : firstOpen));
  const curS = sets[cur] || {}, curP = (ex.plan || [])[cur] || {}, curPh = curP.w ?? (cur > 0 ? (sets[cur - 1] || {}).weight : null) ?? last[cur] ?? last[last.length - 1];
  const isLast = playIdx === t.exercises.length - 1, exDone = doneN(ex) >= n;
  const totalDone = t.exercises.reduce((a, e) => a + doneN(e), 0), totalAll = t.exercises.reduce((a, e) => a + (e.sets || 3), 0);
  const val = curS.weight ?? curPh, vLab = { kg: 'GEWICHT', wdh: 'WDH', sek: 'SEKUNDEN', none: 'SATZ' }[unit] || 'WERT';
  const goal = curP.r != null ? ` · ZIEL ${curP.r} ${unit === 'sek' ? 'S' : '×'}` : '';
  const mainAct = !exDone ? 'playSet' : isLast ? 'playFinish' : 'playNext';
  const mainIc = !exDone ? '✓' : isLast ? '⚑' : '›';
  const mainLab = !exDone ? 'Satz fertig' : isLast ? 'Training beenden' : 'Nächste Übung';
  content.innerHTML = `<div class="pf">
    <div class="pf-bg"></div>
    <div class="pf-gif"><img src="${esc(imgOf(ex))}" alt="" onerror="this.style.visibility='hidden'"></div>
    <div class="pf-shade"></div>
    <div class="pf-top">
      <button class="pf-back" data-act="playExit" aria-label="Zurück">‹</button>
      <div class="pf-title">${esc(t.name)}</div>
      <span class="pf-prog">${totalDone}/${totalAll}</span>
    </div>
    <div class="pf-dots">${t.exercises.map((e, i) => `<button class="${i === playIdx ? 'cur' : ''}${doneN(e) >= (e.sets || 3) ? ' ok' : doneN(e) ? ' part' : ''}" data-act="playGo" data-i="${i}" aria-label="Übung ${i + 1}"></button>`).join('')}</div>
    <div class="pf-bottom">
      <div class="pf-ex exinfo" data-act="exInfo" data-name="${esc(ex.name)}">${esc(dn(ex.name))}<small>${esc(MUSCLE_DE[ex.muscle] || ex.muscle)}${goal}</small></div>
      <div class="pf-lab" id="pf-lab">${restEnd > Date.now() ? 'PAUSE' : 'WORKOUT'}</div>
      <div class="pf-time" id="pf-time">0:00</div>
      <div class="pf-restbtns${restEnd > Date.now() ? '' : ' off'}" id="rest"><button data-act="restAdd">+15 s</button><button data-act="restSkip">Skip</button></div>
      <div class="pf-pills">
        <button class="pf-pill" data-act="playOpen" data-focus="1"><small>${vLab}</small><b>${val != null ? val + (UNITS[unit][1] ? ' ' + UNITS[unit][1] : '') : '–'}</b></button>
        <button class="pf-main${exDone ? ' next' : ''}" data-act="${mainAct}" data-k="${cur}" aria-label="${mainLab}"><span>${mainIc}</span></button>
        <button class="pf-pill" data-act="playOpen"><small>SATZ</small><b>${cur + 1} / ${n}</b></button>
      </div>
      <div class="pf-mainlab">${mainLab}</div>
      <button class="pf-up" data-act="playOpen"><span>⌃</span>NACH OBEN WISCHEN FÜR DETAILS</button>
    </div>
    <div class="pf-sheet${playDrawer ? ' open' : ''}" id="pf-sheet">
      <button class="pf-sheet-grip" data-act="playClose" aria-label="Schließen"><i></i></button>
      <div class="pf-sheet-in">
        <div class="pf-sh-t">${esc(dn(ex.name))}</div>
        <div class="pf-chips">${Array.from({ length: n }, (_, k) => `<button class="pl-chip${(sets[k] || {}).done ? ' done' : ''}${k === cur ? ' cur' : ''}" data-act="playSel" data-k="${k}" aria-label="Satz ${k + 1}">${(sets[k] || {}).done ? '✓' : k + 1}</button>`).join('')}</div>
        ${unit === 'none' ? '' : `<label class="pl-now-in"><input id="pf-in" type="number" inputmode="decimal" data-act="wWeight" data-id="${t.id}" data-i="${playIdx}" data-k="${cur}" value="${curS.weight ?? ''}" placeholder="${curPh ?? (curP.r != null && unit !== 'kg' ? curP.r : '–')}"><span>${UNITS[unit][1] || ''}</span></label>${qchips(unit === 'kg' ? 'w' : 'r', '#pf-in')}`}
        ${curS.done ? `<button class="pf-sh-btn ghost" data-act="playSet" data-k="${cur}">✓ Erledigt – zurücknehmen</button>` : ''}
        <div class="pf-sh-row"><button class="pf-sh-btn ghost" data-act="playPrev"${playIdx === 0 ? ' disabled' : ''}>‹ Zurück</button><button class="pf-sh-btn ghost" data-act="playNext"${isLast ? ' disabled' : ''}>Weiter ›</button></div>
        <button class="pf-sh-btn" data-act="playFinish">${totalDone >= totalAll ? 'Training beenden' : `Beenden · ${totalAll - totalDone} von ${totalAll} Sätzen offen`}</button>
        <div class="pf-sh-row"><button class="pf-sh-btn ghost sm" data-act="playEdit">⚙ Sätze ändern</button><button class="pf-sh-btn ghost sm del" data-act="playDelete">🗑 Löschen</button></div>
      </div>
    </div>
  </div>`;
  if (playDrawer && document.activeElement === document.body) { /* Fokus nur auf Wunsch */ }
  tickRest();
}
function tickRest() {
  const box = document.getElementById('rest'); if (!box) return;
  const left = Math.ceil((restEnd - Date.now()) / 1000);
  if (restEnd && left <= 0) { restEnd = 0; try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {} const l = document.getElementById('pf-lab'); if (l) l.textContent = 'WORKOUT'; }
  box.classList.toggle('off', !restEnd);
  const lab = document.getElementById('pf-lab'); if (lab) lab.textContent = restEnd ? 'PAUSE' : 'WORKOUT';
  const el = document.getElementById('pf-time'); if (el) el.textContent = restEnd ? fmtT(left) : fmtT(Math.floor((Date.now() - playT0) / 1000));
}
setInterval(tickRest, 500);
function renderSummary() {
  const r = summaryRec;
  if (!r) { view = 'overview'; return renderOverview(); }
  const full = r.totalSetsPlanned > 0 && r.totalSetsDone >= r.totalSetsPlanned;
  content.innerHTML = `<div class="pl sm">
    <div class="sm-badge${full ? '' : ' part'}">${full ? '✓' : '◐'}</div>
    <div class="sm-title">${full ? 'Training geschafft' : 'Fertig – unvollständig'}</div>
    <div class="sm-sub">${esc(r.day)}</div>
    <div class="pf-stats"><div><b>${r.durationMin ?? '–'}</b><span>Minuten</span></div><div><b>${r.totalSetsDone}/${r.totalSetsPlanned}</b><span>Sätze</span></div><div><b>${r.calories ?? '–'}</b><span>kcal</span></div></div>
    <div class="ov-card">${r.exercises.map(e => `<div class="pf-row"><span>${esc(dn(e.name))}</span><b>${e.setsDone}/${e.setsTotal}</b></div>`).join('')}</div>
    <button class="ov-btn sm-done" data-act="summaryDone">Fertig</button>
  </div>`;
}

// Vorschau: Training ausgewählt, noch nicht gestartet
let prevId = null, prevKey = null;
function renderPreview() {
  const p = prevKey ? PRESETS.find(x => x.key === prevKey) : null;
  const t = p ? { name: p.name, exercises: presetExercises(p) } : trainingById(prevId);
  if (!t) { view = 'start'; return renderStart(); }
  const sets = t.exercises.reduce((a, e) => a + (e.sets || 3), 0);
  content.innerHTML = `<div class="pv">
    <div class="pl-top"><button class="pl-x" data-act="prevBack" aria-label="Zurück">‹</button>
      <div class="pl-title"><b class="nm-edit" data-act="tName" data-id="${t.id}">${esc(t.name)}<i class="nm-pen" aria-hidden="true">✎</i></b><span>${t.exercises.length} Übungen · ${sets} Sätze</span></div>
      ${p ? '' : `<button class="pl-x pl-del" data-act="prevDelete" aria-label="Training löschen">🗑</button>`}</div>
    <div class="pv-list">${t.exercises.map((e, i) => `<div class="pv-ex exinfo" data-act="exInfo" data-name="${esc(e.name)}"><span class="pv-n">${i + 1}</span>
      <img src="${esc(imgOf(e))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
      <div><b>${esc(dn(e.name))}</b><em>${esc(MUSCLE_DE[e.muscle] || e.muscle)} · ${e.sets || 3} Sätze</em></div></div>`).join('')}</div>
    <div class="pl-nav"><button class="pl-next" data-act="prevGo">▶ TRAINING STARTEN</button></div>
  </div>`;
}

// Trainingshelper: Hinweise über den Funktionen, in Reihenfolge, einzeln wegklickbar
const HELPKEY = 'heimtraining.helper2';
function helperDone() { try { return JSON.parse(localStorage.getItem(HELPKEY)) || []; } catch (e) { return []; } }
function helperHide(id) { const d = helperDone(); if (!d.includes(id)) d.push(id); try { localStorage.setItem(HELPKEY, JSON.stringify(d)); } catch (e) {} }
function hint(id, step, text) {
  if (helperDone().includes(id)) return '';
  return `<div class="hh"><div class="hh-top"><b>TRAININGSHELPER · SCHRITT ${step} VON 5</b><button data-act="hintOk" data-id="${id}">Verstanden</button></div><p>${text}</p></div>`;
}
// aktueller Schritt eines Trainings: 1 Name (immer erledigt, sonst gäbe es es nicht), 2 Übungen, 3 Tage, 4 Starten
function helperStep(t) { return t.draft ? 1 : !t.exercises.length ? 2 : !helperDone().includes('sets') ? 3 : (!t.weekdays || !t.weekdays.length) ? 4 : 5; }

function renderWeeklist() {
  const FULLN = { mon: 'Montag', tue: 'Dienstag', wed: 'Mittwoch', thu: 'Donnerstag', fri: 'Freitag', sat: 'Samstag', sun: 'Sonntag' };
  const DB = '<svg class="lab-db" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/></svg>';
  const t0 = today(), ws = mondayOf(t0);
  const dayNames = WD_KEYS.map(k => FULLN[k] + 'straining');
  const custom = weekplan.filter(w => !dayNames.includes(w.name) || w.exercises.length);
  const meta = t => `${t.exercises.length} Übung${t.exercises.length === 1 ? '' : 'en'} · ${t.weekdays.length ? (d => d.map(k => d.length <= 2 ? FULLN[k] : WD_LABELS[k]).join(d.length <= 2 ? ' + ' : ' '))(WD_KEYS.filter(k => t.weekdays.includes(k))) + (t.time ? ' · ' + esc(t.time) : '') : 'nicht eingeplant'}`;
  const dayTiles = WD_KEYS.map((k, i) => {
    const ds = addDays(ws, i);
    const items = weekplan.map(w => ({ w, status: trainingStatusForDate(w, ds) })).filter(x => x.status);
    const worst = ['verpasst', 'unvollständig', 'offen', 'geplant', 'vorher', 'erledigt'].find(st => items.some(x => x.status === st)) || null;
    const n = items.reduce((sum, x) => sum + x.w.exercises.length, 0);
    const target = (items.find(x => x.status !== 'erledigt') || items[0] || {}).w;
    const act = target ? `data-act="wOpen2" data-id="${target.id}"` : `data-act="wpDay" data-wd="${k}" data-date="${ds}"`;
    return `<div class="wp-cell"><button class="wp-day${worst ? ' wp-' + worst : ' wp-aus'}${worst && worst !== 'verpasst' ? (n ? ' wp-ex' : ' wp-leer') : ''}${ds === t0 ? ' wp-heute' : ''}" ${act}><b>${WD_LABELS[k]}</b>${worst ? DB : '<em>+</em>'}<span>${worst ? (n ? n + ' Üb.' : 'leer') : 'Ruhe'}</span></button>${target ? `<button class="wp-x" data-act="wUnsched" data-id="${target.id}" data-wd="${k}" aria-label="Aus Plan entfernen">×</button>` : ''}</div>`;
  }).join('');
  const customCards = custom.map(t => {
    const th = t.exercises.slice(0, 1).map(ex => `<img src="${esc(imgOf(ex))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`).join('') + (t.exercises.length > 1 ? `<i class="tr-more">+${t.exercises.length - 1}</i>` : '');
    const st = trainingStatusForDate(t, t0), gTop = (muscleShare(t)[0] || [''])[0];
    return `<div class="wp-sw" data-sw="${t.id}"><div class="wp-sw-bg"><span class="a">📥 Archiv</span><span class="d">Löschen 🗑</span></div><div class="wp-card wp-tr" data-g="${esc(gTop)}" data-act="wOpen2" data-id="${t.id}">
      <div class="tr-th">${th || DB}</div>
      <div class="wp-card-body"><div class="wp-card-name nm-edit" data-act="tName" data-id="${t.id}">${esc(t.name)}<i class="nm-pen" aria-hidden="true">✎</i></div><div class="wp-card-meta">${meta(t)}${st ? ' · ' + STATUS_LABEL[st] : ''}</div></div>
      <span class="wp-chev">›</span>
      ${trInfo(t, true)}
      <div class="tr-days">${WD_KEYS.map(k => `<button class="${(t.weekdays || []).includes(k) ? 'on' : ''}" data-act="wDayToggle" data-id="${t.id}" data-wd="${k}">${WD_LABELS[k]}</button>`).join('')}</div>
    </div></div>`;
  }).join('');
  const arch = loadArchive();
  const archBlock = arch.length ? `<button class="wp-arch-h" data-act="archToggle">ARCHIV (${arch.length}) ${archOpen ? '▾' : '▸'}</button>${archOpen ? arch.map(t => `<div class="wp-card wp-arch"><div class="wp-card-body"><div class="wp-card-name nm-edit" data-act="tName" data-id="${t.id}">${esc(t.name)}<i class="nm-pen" aria-hidden="true">✎</i></div><div class="wp-card-meta">${t.exercises.length} Übungen</div></div><button data-act="wRestore" data-id="${t.id}">Zurückholen</button></div>`).join('') : ''}` : '';
  content.innerHTML = `
    <div class="wp">
      <div class="wp-sec">DIESE WOCHE</div>
      <div class="wp-days">${dayTiles}</div>
      <div class="wp-sec">MEINE TRAININGS</div>
      ${customCards || '<p class="xr-hint">Noch keins. Starte ein Training auf Start und speichere es, dann taucht es hier auf.</p>'}
      ${archBlock}
    </div>`;
  if (wpSheet) {
    const wd = wpSheet.wd;
    const rows = weekplan.filter(w => w.exercises.length && !w.weekdays.includes(wd)).map(w => `<button class="wps-row" data-act="wpAssign" data-id="${w.id}"><b>${esc(w.name)}</b>${trInfo(w)}</button>`).join('');
    content.insertAdjacentHTML('beforeend', `<div class="goal-sheet" data-act="wpClose"><div class="goal-edit wps" data-stop="1"><div class="wps-h"><div class="ov-card-title">${FULLN[wd]}: was trainierst du?</div><button class="wps-x" data-act="wpClose" aria-label="Abbrechen">✕</button></div><div class="wps-list">${rows || '<p class="xr-hint">Noch kein Training zum Zuweisen.</p>'}</div><button class="wps-row wps-new" data-act="wpNew"><b>+ Neu planen</b><span>Zeit, Geräte, Fokus</span></button><button class="ov-btn ov-btn-ghost" data-act="wpClose">Abbrechen</button></div></div>`);
    const sh = content.querySelector('.goal-sheet'), tb = document.getElementById('tabbar'), hd = document.querySelector('.topbar');
    if (sh) { const tt = tb ? tb.getBoundingClientRect().top : innerHeight, hb = hd ? hd.getBoundingClientRect().bottom : 0; sh.style.top = Math.round(hb) + 'px'; sh.style.bottom = Math.round(innerHeight - tt) + 'px'; sh.style.height = 'auto'; }
  }
  if (addingTraining) document.getElementById('new-training-name')?.focus();
}

// V2-09: Trainings-Detail – Übungen mit Video(GIF)/Erklärung, editierbare Sätze + Gewicht, Notizen.
function loserName() {
  const used = new Set([...weekplan, ...loadArchive()].map(w => w.name));
  for (let i = 1; i <= 100; i++) if (!used.has('Loser ' + i)) return 'Loser ' + i;
  return 'Loser ' + (100 + weekplan.length);
}
function muscleShare(t) {
  const m = {}; let tot = 0;
  (t.exercises || []).forEach(e => { const k = e.warm ? 'Aufwärmen' : MUSCLE_GROUPS[e.muscle] || MUSCLE_DE[e.muscle] || e.muscle, n = e.sets || 3; m[k] = (m[k] || 0) + n; tot += n; });
  const arr = Object.entries(m).sort((a, b) => (a[0] === 'Aufwärmen') - (b[0] === 'Aufwärmen') || b[1] - a[1]).map(([k, n]) => [k, Math.round(n / tot * 100)]);
  return arr;
}
function shareHtml(t, max) {
  const a = muscleShare(t).slice(0, max || 4);
  return a.length ? `<span class="sh">${a.map(([k, p]) => `<span class="sh-i"><b>${esc(k)}</b> ${p}%</span>`).join('')}</span>` : '';
}
function trInfo(t, compact) {
  const ex = t.exercises || [], sets = ex.reduce((n, e) => n + (e.sets || 3), 0);
  if (!ex.length) return '';
  const min = Math.max(5, Math.round(sets * 2.5 / 5) * 5);
  const sh = muscleShare(t).filter(([k]) => k !== 'Aufwärmen').slice(0, 4);
  const bar = sh.length ? `<span class="ti-bar">${sh.map(([k, p]) => `<i data-g="${esc(k)}" style="flex:${p}"></i>`).join('')}</span><span class="ti-leg">${sh.map(([k, p]) => `<span data-g="${esc(k)}"><i></i>${esc(k)} ${p}%</span>`).join('')}</span>` : '';
  const gl = [...new Set(ex.flatMap(e => gearOf(e.name)))].map(k => (GEAR.find(g => g[0] === k) || [])[1]).filter(Boolean).map(l => l === 'Kurzhanteln' ? 'Hanteln' : l === 'Hantelbank' ? 'Bank' : l);
  const last = loadHistory().filter(r => r.trainingId === t.id).map(r => r.date).sort().pop();
  let ago = 'noch nie trainiert';
  if (last) { const d = Math.round((new Date(today() + 'T00:00:00') - new Date(last + 'T00:00:00')) / 864e5); ago = d <= 0 ? 'heute trainiert' : d === 1 ? 'gestern trainiert' : 'vor ' + d + ' Tagen trainiert'; }
  if (compact) return sh.length ? `<div class="ti ti-c">${bar}</div>` : '';
  return `<span class="ti"><span class="ti-top"><b>~${min} Min</b> · ${ex.length} Üb. · ${sets} Sätze · ${ago}</span>${bar}${gl.length ? `<span class="ti-gear">${gl.map(l => `<em>${esc(l)}</em>`).join('')}</span>` : ''}</span>`;
}
function newDraft() {
  const t = { id: 'w' + Date.now(), name: loserName(), draft: true, exercises: [], weekdays: [], since: {}, time: '' };
  weekplan.push(t); wId = t.id; renameId = t.id; view = 'wtrain'; picker = null;
}
const wOpen = new Set(); // UI-Zustand: 'tid:i' = Einstellungen offen, 'tid:i:s' = Sätze einzeln
const QC = { w: [[5, 10, 15, 20, 25, 30, 40, 50], []], r: [[5, 8, 10, 12, 15, 20, 30, 50], [10, 50, 100]] };
function qchips(f, target) {
  const unitL = f === 'w' ? ' kg' : '';
  return `<div class="qc" data-f="${f}" data-target='${target}'>${QC[f][0].map(v => `<button type="button" data-qv="${v}" data-mode="set">${v}${unitL}</button>`).join('')}${QC[f][1].map(v => `<button type="button" class="add" data-qv="${v}" data-mode="add">+${v}</button>`).join('')}</div>`;
}
// ---- V13 W-01: Level-Vorlagen (Richtwerte aus Coach-Bericht, Vault Coach-Regeln-V13) ----
const LEVELS = [['anf', 'Anfänger'], ['fort', 'Fortgeschritten'], ['pro', 'Profi']];
// Anteil am Körpergewicht je Typ: [Anfänger, Fortgeschritten, Profi]; Kurzhantel pro Hand, Langhantel gesamt
const SW = { bankLH: [.25, .60, .90], pressKH: [.10, .25, .38], rudernLH: [.25, .50, .75], rudernKH: [.10, .22, .33],
  kniebeugeLH: [.35, .75, 1.2], kniebeugeKH: [.15, .30, .45], kreuzLH: [.45, 1.0, 1.5], schulterLH: [.18, .40, .60], schulterKH: [.07, .17, .26],
  curlLH: [.15, .30, .45], curlKH: [.06, .13, .20], trizKH: [.06, .13, .20], seilGross: [.35, .60, .85], seilIso: [.12, .25, .38],
  isoKH: [.02, .05, .08], beinKH: [.10, .20, .30] };
const PLATES_TOTAL = 45; // Alex: Scheiben insgesamt 45 kg (5 / 2,5 / 1,25)
function swType(ex) {
  const n = ex.name.toLowerCase(), m = ex.muscle;
  const lh = /barbell|ez.bar|ez bar|long bar|t-bar/.test(n), kh = /dumbbell|\bdb\b|kettlebell/.test(n), cab = /cable|pulldown|pulley|pushdown|face pull/.test(n);
  if (/band/.test(n) || (!lh && !kh && !cab)) return null; // Bänder/Körpergewicht: kein kg-Vorschlag
  const big = ['chest', 'lats', 'middle back', 'quadriceps', 'hamstrings', 'glutes', 'lower back'].includes(m);
  if (/deadlift|rack pull/.test(n)) return 'kreuzLH';
  if (/squat/.test(n)) return lh ? 'kniebeugeLH' : 'kniebeugeKH';
  if (/lunge|step.?up|split squat/.test(n)) return 'beinKH';
  if (/bench press|chest press/.test(n)) return lh ? 'bankLH' : (kh ? 'pressKH' : 'seilGross');
  if (/shoulder press|overhead|military|arnold|push press/.test(n)) return lh ? 'schulterLH' : 'schulterKH';
  if (/curl/.test(n)) return lh ? 'curlLH' : (cab ? 'seilIso' : 'curlKH');
  if (/triceps|pushdown|skull|extension/.test(n)) return cab ? 'seilIso' : (lh ? 'curlLH' : 'trizKH');
  if (/row|pull-?up|pulldown|chin/.test(n)) return cab ? 'seilGross' : (lh ? 'rudernLH' : 'rudernKH');
  if (/lateral|raise|fly|flye|kickback|shrug|upright/.test(n)) return cab ? 'seilIso' : 'isoKH';
  if (/press/.test(n)) return lh ? 'bankLH' : (cab ? 'seilGross' : 'pressKH');
  if (cab) return big ? 'seilGross' : 'seilIso';
  return lh ? (big ? 'rudernLH' : 'curlLH') : (big ? 'pressKH' : 'isoKH');
}
const GOALS = [['aufbau', 'Aufbau'], ['kraft', 'Kraft'], ['def', 'Definition']];
// letzte Einheiten einer Übung aus dem Verlauf (neueste zuletzt)
function histOf(name) { return loadHistory().slice().sort((a, b) => (a.finishedAt || a.date) < (b.finishedAt || b.date) ? -1 : 1)
  .map(r => (r.exercises || []).find(e => e.name === name)).filter(e => e && e.weights && e.weights.some(w => w != null)); }
function suggestEx(ex, lv, goal) { // lv 0/1/2 → {sets, reps, w|null}
  goal = goal || 'aufbau';
  const n = ex.name.toLowerCase(), u = ex.unit || 'kg';
  const comp = /press|squat|deadlift|row|pull-?up|pulldown|lunge|dip|chin/.test(n);
  let sets = comp ? (lv === 2 ? 4 : 3) : (lv === 0 ? 2 : 3);
  if (goal === 'kraft') sets = comp ? (lv === 0 ? 3 : 4) : 2; else if (goal === 'def') sets = 3;
  if (u === 'sek') return { sets: 3, reps: lv === 0 ? 20 : 30, w: null };
  let reps = comp ? 10 : 12;
  if (goal === 'kraft') reps = comp ? (lv === 0 ? 8 : 5) : 10; else if (goal === 'def') reps = comp ? 14 : 17; else if (u === 'wdh') reps = lv === 0 ? 10 : 12;
  if (u !== 'kg') return { sets, reps, w: null };
  const prof = loadProfile(), bw = prof.weight;
  const t = swType(ex);
  if (!t) return { sets, reps, w: null };
  const isLH = /LH$/.test(t), isKH = /KH$/.test(t), bar = prof.bar || 10;
  const step = isKH ? 2 : 2.5;
  let w = null;
  if (bw) {
    w = bw * SW[t][lv];
    if (lv === 0) { if (t === 'bankLH') w = Math.min(w, .5 * bw); if (t === 'kreuzLH') w = Math.min(w, .8 * bw); if (t === 'kniebeugeLH') w = Math.min(w, .6 * bw); }
    if (isLH) w = Math.min(Math.max(bar, Math.round(w / 2.5) * 2.5), bar + PLATES_TOTAL);
    else if (isKH) w = Math.max(2, Math.round(w / 2) * 2);
    else w = Math.max(5, Math.round(w / 2.5) * 2.5);
  }
  const hw = histWeight(ex.name, step); // Verlauf schlägt Formel
  if (hw != null) { w = hw; if (isLH) w = Math.min(w, bar + PLATES_TOTAL); }
  if (w == null) return { sets, reps, w: null, noBw: true };
  return { sets, reps, w };
}
function histWeight(name, step) {
  const h = histOf(name); if (!h.length) return null;
  const mx = e => Math.max(...e.weights.filter(x => x != null));
  const last = h[h.length - 1], prev = h[h.length - 2], w = mx(last), full = e => e.setsDone >= e.setsTotal;
  if (!full(last)) return w;
  if (prev && full(prev) && mx(prev) === w) return w + step;
  return w;
}
function applyLevel(t, lv) {
  let miss = false;
  t.exercises.forEach(ex => { const r = suggestEx(ex, lv, t.goal); if (r.noBw) miss = true;
    ex.sets = r.sets; ex.plan = Array.from({ length: r.sets }, () => ({ w: r.w, r: r.reps })); });
  t.level = lv; saveWeekplan(); return miss;
}
function exCard(t, ex, i) {
  const u = ex.unit || 'kg', n = ex.sets || 3, plan = ex.plan || [];
  const at = (k, f) => (plan[k] || {})[f] ?? null;
  const uniform = Array.from({ length: n }, (_, k) => k).every(k => at(k, 'w') === at(0, 'w') && at(k, 'r') === at(0, 'r'));
  const split = u !== 'none' && !uniform; // nur bei bereits unterschiedlichen Werten (alte Daten)
  const rl = u === 'sek' ? 'Sek' : 'Wdh';
  const da = `data-id="${t.id}" data-i="${i}"`;
  const sel = `<select class="xc-unit" data-act="wUnit" ${da} aria-label="Eintragen als">${Object.entries({ kg: 'kg · Wdh', wdh: 'Wdh', sek: 'Sek' }).map(([v, l]) => `<option value="${v}"${u === v ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
  const fld = (act, f, k, val) => `<label class="xc-f"><input type="number" inputmode="${f === 'w' ? 'decimal' : 'numeric'}" value="${val ?? ''}" placeholder="${f === 'w' ? 'kg' : rl}" data-act="${act}" ${da}${k === null ? '' : ` data-k="${k}"`} data-f="${f}" aria-label="${f === 'w' ? 'kg' : rl}"><span>${f === 'w' ? 'kg' : rl}</span></label>`;
  let rowB = `<div class="xc-step"><button data-act="wSetsAdj" ${da} data-d="-1" aria-label="Ein Satz weniger">–</button><b>${n}</b><button data-act="wSetsAdj" ${da} data-d="1" aria-label="Ein Satz mehr">+</button></div><span class="xc-x">×</span>`;
  if (split) rowB += `<button class="xc-same" data-act="wSame" ${da}>Sätze angleichen</button>`;
  else rowB += `${u === 'kg' ? fld('wPlanAll', 'w', null, at(0, 'w')) : ''}${fld('wPlanAll', 'r', null, at(0, 'r'))}`;
  const pills = split ? `<div class="xc-pills">${Array.from({ length: n }, (_, k) => `<div class="xc-pill"><b>${k + 1}</b>${u === 'kg' ? fld('wPlan', 'w', k, at(k, 'w')) : ''}${fld('wPlan', 'r', k, at(k, 'r'))}</div>`).join('')}</div>` : '';
  const chips = split ? '' : `${u === 'kg' ? qchips('w', `[data-act=wPlanAll][data-f=w]`) : ''}${qchips('r', `[data-act=wPlanAll][data-f=r]`)}`;
  return `<div class="ts-set xc"><div class="xc-top"><span class="xc-n">${esc(dn(ex.name))}</span>${sel}</div><div class="xc-row">${rowB}</div>${chips}${pills}</div>`;
}
let lvMsg = '', ctlOpen = false;
function txRow(t, ex, i) {
  const u = ex.unit || 'kg', n = ex.sets || 3, plan = ex.plan || [];
  const at = (k, f) => (plan[k] || {})[f] ?? null;
  const uniform = Array.from({ length: n }, (_, k) => k).every(k => at(k, 'w') === at(0, 'w') && at(k, 'r') === at(0, 'r'));
  const split = u !== 'none' && !uniform;
  const rl = u === 'sek' ? 'Sek' : 'Wdh';
  const da = `data-id="${t.id}" data-i="${i}"`;
  const sel = `<select class="xc-unit" data-act="wUnit" ${da} aria-label="Eintragen als">${Object.entries({ kg: 'kg · Wdh', wdh: 'Wdh', sek: 'Sek' }).map(([v, l]) => `<option value="${v}"${u === v ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
  const fld = (act, f, k, val) => `<label class="xc-f"><input type="number" inputmode="${f === 'w' ? 'decimal' : 'numeric'}" value="${val ?? ''}" placeholder="${f === 'w' ? 'kg' : rl}" data-act="${act}" ${da}${k === null ? '' : ` data-k="${k}"`} data-f="${f}" aria-label="${f === 'w' ? 'kg' : rl}"><span>${f === 'w' ? 'kg' : rl}</span></label>`;
  const step = `<div class="xc-step"><button data-act="wSetsAdj" ${da} data-d="-1" aria-label="Ein Satz weniger">–</button><b>${n}</b><button data-act="wSetsAdj" ${da} data-d="1" aria-label="Ein Satz mehr">+</button></div><span class="xc-x">×</span>`;
  const vals = split ? `<button class="xc-same" data-act="wSame" ${da}>Sätze angleichen</button>` : `${u === 'kg' ? fld('wPlanAll', 'w', null, at(0, 'w')) : ''}${fld('wPlanAll', 'r', null, at(0, 'r'))}`;
  const pills = split ? `<div class="xc-pills">${Array.from({ length: n }, (_, k) => `<div class="xc-pill"><b>${k + 1}</b>${u === 'kg' ? fld('wPlan', 'w', k, at(k, 'w')) : ''}${fld('wPlan', 'r', k, at(k, 'r'))}</div>`).join('')}</div>` : '';
  const chips = split ? '' : `${u === 'kg' ? qchips('w', `[data-act=wPlanAll][data-f=w]`) : ''}${qchips('r', `[data-act=wPlanAll][data-f=r]`)}`;
  const last = i === t.exercises.length - 1;
  const key = t.id + '|' + i, open = txOpen === key;
  const sumTxt = u === 'none' ? n + ' Sätze' : n + ' × ' + (uniform ? (at(0, 'r') ?? '–') + ' ' + rl : 'variiert') + (u === 'kg' && at(0, 'w') != null ? ' · ' + (uniform ? at(0, 'w') : 'ab ' + at(0, 'w')) + ' kg' : '');
  return `<div class="tx-sw" data-tsw="${t.id}|${i}"><div class="gn-sw-bg"><span>★ Favorit</span><span>Neue Übung ↻</span></div><div class="tx-row ts-set xc${open ? ' open' : ''}"${ex.warm ? '' : ` data-g="${esc(MUSCLE_GROUPS[ex.muscle] || '')}"`} style="--i:${Math.min(i, 10)}">
    <button class="tx-th" data-act="exInfo" data-name="${esc(ex.name)}" aria-label="Übungsdaten"><img src="${esc(imgOf(ex))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"></button>
    <button class="tx-nm" data-act="txToggle" data-key="${esc(key)}"><b>${esc(dn(ex.name))}</b><em>${ex.warm ? '🔥 Aufwärmen · ' : ''}${esc(MUSCLE_DE[ex.muscle] || ex.muscle)} · ${sumTxt}</em><i class="tx-ch">${open ? '▴' : '▾'}</i></button>
    <span class="ts-mv"><button data-act="wMoveEx" data-id="${t.id}" data-i="${i}" data-d="-1" aria-label="Nach oben"${i === 0 ? ' disabled' : ''}>▲</button><button data-act="wMoveEx" data-id="${t.id}" data-i="${i}" data-d="1" aria-label="Nach unten"${last ? ' disabled' : ''}>▼</button></span>
    <button class="tx-rm" data-act="wRemoveEx" data-id="${t.id}" data-i="${i}" aria-label="Übung entfernen">✕</button>
    <div class="tx-ed">${step}${vals}${sel}</div>${chips}${pills}
    ${open ? `<button class="tx-to" data-act="txTo" data-id="${t.id}" data-i="${i}">↪ In anderes Training</button>` : ''}
  </div></div>`;
}
// Übung in anderes Training kopieren/verschieben
let txTo = null;
function txToSheet(t) {
  const ex = t.exercises[txTo.i]; if (!ex) return '';
  const others = weekplan.filter(w => w.id !== t.id && !w.draft);
  return `<button class="to-bg" data-act="txToClose" aria-label="Schließen"></button><div class="to-sheet"><b>${esc(dn(ex.name))}</b>
    <div class="tr-seg"><button class="${txTo.mv ? '' : 'on'}" data-act="txToMode" data-v="0">Kopieren</button><button class="${txTo.mv ? 'on' : ''}" data-act="txToMode" data-v="1">Verschieben</button></div>
    <div class="to-list">${others.map(w => `<button data-act="txToPick" data-tid="${w.id}"><span>${esc(w.name)}</span><em>${w.exercises.length} Üb.${w.exercises.some(x => x.name === ex.name) ? ' · schon drin' : ''}</em></button>`).join('')}<button class="to-new" data-act="txToPick" data-tid="new">+ Neues Training</button></div>
    <button class="to-x" data-act="txToClose">Abbrechen</button></div>`;
}
function wtHero(t, sets) {
  const min = Math.max(5, Math.round(sets * 2.5 / 5) * 5), tile = (n, l, i) => `<div class="gh-t" style="--i:${i}"><b>${n}</b><em>${l}</em></div>`;
  const sh = muscleShare(t).filter(([k]) => k !== 'Aufwärmen').slice(0, 5);
  const bar = sh.length ? `<span class="ti-bar">${sh.map(([k, p]) => `<i data-g="${esc(k)}" style="flex:${p}"></i>`).join('')}</span><span class="ti-leg">${sh.map(([k, p]) => `<span data-g="${esc(k)}"><i></i>${esc(k)} ${p}%</span>`).join('')}</span>` : '';
  return `<div class="gh th-hero"><div class="gh-row">${tile(t.exercises.length, 'Übungen', 0)}${tile(sets, 'Sätze', 1)}${tile('~' + min, 'Minuten', 2)}</div>${bar ? `<div class="ti ti-c th-mix">${bar}</div>` : ''}</div>`;
}
function renderWTrain() {
  const t = trainingById(wId);
  if (!t) { view = 'overview'; return renderOverview(); }
  const prevScroll = content.querySelector('.tx-rows') ? content.querySelector('.tx-rows').scrollTop : 0;
  const step = helperStep(t);
  const started = startOf(t.id, today());
  const hasEx = t.exercises.length > 0, hasDays = t.weekdays && t.weekdays.length > 0;
  const ws = mondayOf(today()), miss = Array.from({ length: 7 }, (_, i) => addDays(ws, i)).filter(ds => trainingStatusForDate(t, ds) === 'verpasst');
  const totalSets = t.exercises.reduce((n, e) => n + (e.sets || 3), 0);
  const ready = hasEx && hasDays && !t.draft;
  const hintHtml = t.draft && renameId === t.id ? hint('name', 1, 'Gib deinem Training einen Namen, zum Beispiel „Oberkörper“ oder „Montag“. Danach geht es mit den Übungen weiter.')
    : step === 2 ? hint('ex', 2, 'Hier fügst du Übungen hinzu: auf „+ Übung“ tippen, suchen und antippen. Du kannst mehrere nacheinander wählen.')
    : step === 3 && hasEx ? hint('sets', 3, 'Pro Übung: Sätze, kg und Wiederholungen eintragen (gilt für alle Sätze). Felder dürfen leer bleiben.')
    : step === 4 && hasEx ? hint('days', 4, 'Hier legst du fest, an welchen Tagen du dieses Training machst. Tippe einfach die Wochentage an.')
    : step === 5 && hasEx ? hint('go', 5, 'Fertig eingerichtet! Tippe auf „Training starten“, wenn du loslegen willst. Alles lässt sich jederzeit ändern.') : '';
  const head = renameId === t.id
    ? `<div class="tx-head"><input id="rename-input" placeholder="Name des Trainings…" value="${esc(t.name)}"><div class="tx-hbtns"><button data-act="wRenameSave" data-id="${t.id}">Speichern</button><button data-act="wRenameCancel" data-id="${t.id}">Abbrechen</button></div></div>`
    : `<div class="tx-head"><button class="tx-back" data-act="wBack">‹ Zurück</button><h2 class="nm-edit" data-act="wRename" data-id="${t.id}"><span class="nm-t">${esc(t.name)}</span><i class="nm-pen" aria-hidden="true">✎</i></h2><button class="tx-fav${t.fav ? ' on' : ''}" data-act="trFav" data-id="${t.id}" aria-label="Favorit">${t.fav ? '★' : '☆'}</button></div>`;
  const dayLbl = hasDays ? WD_KEYS.filter(k => t.weekdays.includes(k)).map(k => WD_LABELS[k]).join(' ') : 'Tage wählen';
  const lvNow = t.level != null ? LEVELS[t.level][1] : 'Level';
  const ctl = hasEx ? `<aside class="tx-ctl${ctlOpen ? ' open' : ''}">
      <button class="tx-sum${hasDays ? '' : ' need'}" data-act="ctlToggle"><span>${esc(dayLbl)}${t.time ? ' · ' + esc(t.time) : ''} · ${esc(lvNow)}</span><i>${ctlOpen ? '▾' : '▴'}</i></button>
      <div class="tx-sheet"><div class="tx-sheet-in">
        <div class="tx-lab">Vorlage nach Level</div>
        <div class="pp-seg">${LEVELS.map(([k, l], x) => `<button class="${t.level === x ? 'on' : ''}" data-act="wLevel" data-id="${t.id}" data-lv="${x}">${l}</button>`).join('')}</div>
        ${lvMsg ? `<div class="lv-msg">${lvMsg}</div>` : ''}
        <div class="tx-lab">Tage &amp; Uhrzeit</div>
        <div class="tx-days">${WD_KEYS.map(k => `<button class="chip${t.weekdays.includes(k) ? ' active' : ''}" data-act="wDayToggle" data-id="${t.id}" data-wd="${k}">${WD_LABELS[k]}</button>`).join('')}</div>
        <input type="time" class="w-schedule-time" data-act="wTime" data-id="${t.id}" value="${esc(t.time || '')}" title="Uhrzeit (informativ, kein Cutoff)">
        ${miss.length ? `<div class="w-missed">${miss.map(ds => `<span>${WD_LABELS[wdKeyOf(ds)]} verpasst</span><button data-act="wSkip" data-id="${t.id}" data-date="${ds}">Als Ruhetag werten</button>`).join('')}</div>` : ''}
        <button class="ts-del" data-act="wDelete" data-id="${t.id}">Training löschen</button>
      </div></div>
      <div class="tx-go"><button class="ts-save" data-act="wSavePack">✓ SPEICHERN</button><button class="pl-next ts-go${ready ? ' rdy' : ''}" data-act="${started ? 'quickStart' : 'wStart'}" data-id="${t.id}">${started ? '▶ FORTSETZEN' : '▶ STARTEN'}</button></div>
    </aside>` : `<aside class="tx-ctl"><button class="ts-del" data-act="wDelete" data-id="${t.id}">Training löschen</button></aside>`;
  content.innerHTML = `<div class="tsx2">
    ${head}
    ${hintHtml ? `<div class="tx-hint">${hintHtml}</div>` : ''}
    <section class="tx-list"><div class="tx-rows">${hasEx ? wtHero(t, totalSets) : ''}${t.exercises.map((ex, i) => txRow(t, ex, i)).join('')}<button class="ts-add" data-act="wAddEx" data-id="${t.id}">+ Übung hinzufügen</button></div></section>
    ${ctl}
    ${txTo && txTo.id === t.id ? txToSheet(t) : ''}
  </div>`;
  const rows = content.querySelector('.tx-rows'); if (rows) rows.scrollTop = prevScroll;
  if (renameId === t.id) document.getElementById('rename-input')?.focus();
}

// V7-01: Profil-Seite – Basis für Kalorienberechnung (V8-03), keine Herzfrequenz nötig.
// Level-Vorschlag aus dem Verlauf (Coach-Regeln, vereinfacht): nie automatisch, nur Vorschlag
function levelSuggestion() {
  const p = loadProfile(), cur = p.level != null ? p.level : 0, h = loadHistory(), now = Date.now(), day = 864e5;
  const within = d => h.filter(r => now - new Date(r.date + 'T12:00:00') <= d * day);
  const rate = a => a.length ? a.reduce((x, r) => x + (r.totalSetsPlanned ? r.totalSetsDone / r.totalSetsPlanned : 0), 0) / a.length : 0;
  if (cur === 0) {
    const a = within(84); if (a.length < 24 || rate(a) < .6) return null;
    const first = {}, max = {};
    h.slice().sort((x, y) => x.date < y.date ? -1 : 1).forEach(r => (r.exercises || []).forEach(e => { const m = Math.max(0, ...(e.weights || []).filter(w => w != null)); if (m > 0) { if (first[e.name] == null) first[e.name] = m; max[e.name] = Math.max(max[e.name] || 0, m); } }));
    return Object.keys(first).filter(k => max[k] >= first[k] * 1.3).length >= 3 ? 1 : null;
  }
  if (cur === 1) { const a = within(182); return a.length >= 60 && rate(a) >= .5 ? 2 : null; }
  return null;
}
// V22: Trainings-Seite – alle fertigen Trainings übersichtlich, Start mit einem Tipp
let trTab = 'act', wFrom = null;
function renderTrainings() {
  const t0 = today(), arch = loadArchive();
  const dayNames = WD_KEYS.map(k => ({ mon: 'Montag', tue: 'Dienstag', wed: 'Mittwoch', thu: 'Donnerstag', fri: 'Freitag', sat: 'Samstag', sun: 'Sonntag' }[k] + 'straining'));
  const act = weekplan.filter(w => !w.draft && (!dayNames.includes(w.name) || w.exercises.length));
  const favEx = loadFavs().map(n => pool.find(e => e.name === n)).filter(Boolean);
  const favs = act.filter(w => w.fav), list = trTab === 'arch' ? arch : trTab === 'fav' ? favs : act;
  const card = t => {
    const th = t.exercises.slice(0, 1).map(ex => `<img src="${esc(imgOf(ex))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`).join('') + (t.exercises.length > 1 ? `<i class="tr-more">+${t.exercises.length - 1}</i>` : '');
    const gTop = (muscleShare(t)[0] || [''])[0];
    const st = trTab === 'arch' ? '' : trainingStatusForDate(t, t0);
    const sh = muscleShare(t).slice(0, 3).map(x => x[0]).join(' · ');
    const meta = `${t.exercises.length} Übung${t.exercises.length === 1 ? '' : 'en'}${sh ? ' · ' + esc(sh) : ''}`;
    const go = trTab === 'arch' ? `<button class="tr-go ghost" data-act="wRestore" data-id="${t.id}">↩</button>` : `<button class="tr-go" data-act="quickStart" data-id="${t.id}" aria-label="Starten"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>`;
    const del = `<button class="tr-del" data-act="trDel" data-id="${t.id}" aria-label="Training löschen"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button>`;
    const strip = true ? '' : `<div class="tr-days">${WD_KEYS.map(k => `<button class="${(t.weekdays || []).includes(k) ? 'on' : ''}" data-act="wDayToggle" data-id="${t.id}" data-wd="${k}">${WD_LABELS[k]}</button>`).join('')}</div>`;
    const c = `<div class="tr-card pp-t" data-g="${esc(gTop)}" style="--i:${Math.max(0, list.indexOf(t))}" ${trTab === 'arch' ? '' : `data-act="wOpen2" data-id="${t.id}"`}><div class="tr-th">${th || ''}</div>${trTab === 'arch' ? '' : `<button class="tr-fav${t.fav ? ' on' : ''}" data-act="trFav" data-id="${t.id}" aria-label="Favorit">${t.fav ? '★' : '☆'}</button>`}<div class="tr-b"><b>${esc(t.name)}</b><span>${trTab === 'arch' ? meta : t.exercises.length + ' Übung' + (t.exercises.length === 1 ? '' : 'en')}</span>${st ? `<i class="tr-st tr-${st}">${STATUS_LABEL[st]}</i>` : ''}</div>${del}${go}${trTab === 'arch' ? '' : trInfo(t, true)}${strip}</div>`;
    return trTab === 'arch' ? c : `<div class="wp-sw tr-sw" data-sw="${t.id}"><div class="wp-sw-bg"><span class="a">📥 Archiv</span><span class="d">Löschen 🗑</span></div>${c}</div>`;
  };
  const days = new Set(); act.forEach(w => (w.weekdays || []).forEach(d => days.add(d))); const exN = act.reduce((n, w) => n + w.exercises.length, 0);
  const heroFav = trTab === 'fav' ? `<div class="gh tr-hero"><div class="gh-row" style="grid-template-columns:repeat(2,1fr)"><div class="gh-t" style="--i:0"><b>${favEx.length}</b><em>Lieblingsübungen</em></div><div class="gh-t" style="--i:1"><b>${favs.length}</b><em>Lieblingstrainings</em></div></div></div>` : '';
  const hero = heroFav || (trTab === 'act' ? `<div class="gh tr-hero"><div class="gh-row"><div class="gh-t" style="--i:0"><b>${act.length}</b><em>Trainings</em></div><div class="gh-t" style="--i:1"><b>${days.size}<small>/7</small></b><em>Tage geplant</em></div><div class="gh-t" style="--i:2"><b>${exN}</b><em>Übungen</em></div></div></div>` : '');
  content.innerHTML = `<div class="tr">${hero}
    <div class="tr-seg"><button class="${trTab === 'act' ? 'on' : ''}" data-act="trTab" data-v="act">Aktiv <em>${act.length}</em></button><button class="${trTab === 'fav' ? 'on' : ''}" data-act="trTab" data-v="fav">★ Favoriten <em>${favs.length + favEx.length}</em></button><button class="${trTab === 'arch' ? 'on' : ''}" data-act="trTab" data-v="arch">Archiv <em>${arch.length}</em></button></div>
    <div class="tr-list">${trTab === 'fav' && favEx.length ? `<div class="tr-fx">${favEx.map(e => `<button class="tr-fxr" data-g="${esc(MUSCLE_GROUPS[e.muscle] || '')}" style="--i:${favEx.indexOf(e)}" data-act="exInfo" data-name="${esc(e.name)}"><img src="${esc(imgOf(e))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><span><b>${esc(dn(e.name))}</b><em><i class="gx-t g" data-g="${esc(MUSCLE_GROUPS[e.muscle] || '')}">${esc(MUSCLE_DE[e.muscle] || e.muscle)}</i></em></span><u class="tr-star">★</u></button>`).join('')}</div>` : ''}${list.length ? list.map(card).join('') : `<p class="tr-empty">${trTab === 'arch' ? 'Archiv ist leer.' : trTab === 'fav' ? (favEx.length ? '' : 'Noch keine Favoriten. Tippe ☆ bei einer Übung oder einem Training.') : 'Noch keine Trainings.'}</p>`}</div>
    <div class="tr-act"><button class="tr-new" data-act="wNewTraining">+ Neu</button><button class="tr-gen" data-act="genOpen">✦ JETZT TRAINIEREN</button></div>
  </div>`;
}

function renderProfile() {
  const p = loadProfile();
  const h = loadHistory();
  const goal = loadGoal();
  const streak = computeStreak(h);
  const sets = h.reduce((n, r) => n + (r.totalSetsDone || 0), 0);
  const first = h.length ? h.reduce((m, r) => r.date < m ? r.date : m, h[0].date) : null;
  const since = first ? new Date(first + 'T12:00:00').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) : null;
  const ini = (p.name || '').trim().charAt(0).toUpperCase();
  const gDone = h.filter(r => Date.now() - new Date(r.date + 'T12:00:00') <= goal.periodDays * 864e5).length, gPct = Math.min(100, Math.round(gDone / Math.max(1, goal.target) * 100));
  content.innerHTML = `
    <div class="overview prof-page">
      <div class="pp-hero pp-t" style="--i:0">
        <div class="pp-ring"><div class="pp-av">${ini ? esc(ini) : '◉'}</div></div>
        <div class="pp-who">
          <input class="pp-name" placeholder="Dein Name" maxlength="24" data-act="profileField" data-field="name" value="${esc(p.name || '')}">
          <div class="pp-chips"><span class="lab-chip"><i></i>${since ? 'DABEI SEIT ' + esc(since.toUpperCase()) : 'NEU DABEI'}</span><span class="lab-chip pp-lv">${esc(LEVELS[p.level == null ? 0 : p.level][1].toUpperCase())}</span></div>
        </div>
      </div>
      <div class="pp-stats pp-t" style="--i:1">
        <div><b>${h.length}</b><span>Trainings</span></div>
        <div><b>${streak}</b><span>Streak</span></div>
        <div><b>${sets}</b><span>Sätze</span></div>
      </div>
      <div class="pp-goal pp-t" style="--i:2">
        <div class="pg-txt"><small>ZIEL</small><span class="pg-n"><b>${gDone}</b><i>/${goal.target}</i></span><span class="pg-p">Trainings · ${goal.periodDays === 7 ? 'diese Woche' : 'letzte ' + goal.periodDays + ' Tage'}</span></div>
        <button class="pg-edit" data-act="goalEditFromProfile" aria-label="Ziel anpassen">✎</button>
        <div class="pg-bar"><i style="width:${gPct}%"></i></div>
      </div>
      <div class="pp-sec pp-t" style="--i:3">Deine Werte</div>
      <div class="pp-body">
        <label class="pp-tile pp-t" style="--i:3"><small>Gewicht</small><input type="number" inputmode="decimal" data-act="profileField" data-field="weight" value="${p.weight ?? ''}" placeholder="–"><em>kg</em></label>
        <label class="pp-tile pp-t" style="--i:4"><small>Größe</small><input type="number" inputmode="numeric" data-act="profileField" data-field="height" value="${p.height ?? ''}" placeholder="–"><em>cm</em></label>
        <label class="pp-tile pp-t" style="--i:5"><small>Stange</small><input type="number" inputmode="decimal" data-act="profileField" data-field="bar" value="${p.bar ?? ''}" placeholder="10"><em>kg</em></label>
        <label class="pp-tile pp-t" style="--i:6"><small>Pause</small><input type="number" inputmode="numeric" data-act="profileField" data-field="rest" value="${p.rest ?? ''}" placeholder="90"><em>Sek</em></label>
      </div>
      <div class="pp-lvbox pp-t" style="--i:7">
        ${(() => { const ls = levelSuggestion(); return ls != null ? `<div class="pp-up">Zeit für <b>${LEVELS[ls][1]}</b> <button data-act="lvlUp" data-lv="${ls}">Übernehmen</button></div>` : ''; })()}
        <div class="pp-sec">Level</div>
        <div class="pp-seg">${LEVELS.map(([k, l], x) => `<button class="${(p.level == null ? 0 : p.level) === x ? 'on' : ''}" data-act="profLevel" data-v="${x}">${l}</button>`).join('')}</div>
        <div class="pp-duo">
        <div class="pp-seg pp-gen">${[['m', 'Mann'], ['w', 'Frau']].map(([k, l]) => `<button class="${(p.gender || 'm') === k ? 'on' : ''}" data-act="profGender" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="pp-seg pp-lang">${[['de', 'DE'], ['en', 'EN']].map(([k, l]) => `<button class="${(p.lang || 'de') === k ? 'on' : ''}" data-act="profLang" data-v="${k}">${l}</button>`).join('')}</div>
        </div>
      </div>
      <div class="pp-foot pp-t" style="--i:8">
      <button class="pp-reset" data-act="helperReset">Hinweise zurücksetzen</button>
      <button class="pp-reset" data-act="appReload">↻ Neu laden · ${((document.querySelector('script[src^="script.js"]') || {}).src || '').split('v=')[1] || ''}</button>
      ${loadBad().length ? `<button class="pp-reset" data-act="badCopy">⚑ ${loadBad().length} falsche Bilder kopieren</button>` : ''}
      </div>
    </div>`;
}

// V3: Mobile/Content-Seite für "Alle Übungen" – Push/Pull/Legs/Core zum Antippen
// (auf Desktop-Breite steht die Sidebar-Version daneben, hier der Direktzugriff für iPhone).
let browsePage = 0;
const BPAGE = 24; let browseLimit = BPAGE;
let txOpen = null; // Tagestraining: welche Übungszeile ist zum Bearbeiten aufgeklappt
let browseQ = '', browseSel = null, filterOpen = false; // "Alle Übungen": Suchtext, gewählte Übung (Detail-Sheet), Filter-Sheet offen
// Gerät aus dem Namen (DB hat kein Feld) – nur für das Badge
function equipBadge(name) {
  const n = name.toLowerCase();
  if (n.includes('smith')) return 'Smith';
  if (/kettlebell|machine|lever|sled|ball|medicine/.test(n)) return 'Gerät';
  for (const [k, l] of [['dumbbell', 'KH'], ['barbell', 'LH'], ['cable', 'Seilzug'], ['band', 'Band']]) if (n.includes(k)) return l;
  return 'Körper';
}
// Zweitmuskeln (Heuristik aus Name – DB hat nur den Hauptmuskel)
function secondaries(e) {
  const n = e.name.toLowerCase(), m = e.muscle, r = [];
  const press = /press|push-up|push up|pushup|dip|close.grip/.test(n) && !/fly|flye|crossover|raise|pullover|shrug/.test(n);
  if ((m === 'chest' || m === 'shoulders') && press) r.push('Trizeps');
  if (m === 'chest' && press) r.push('Schultern');
  if (m === 'triceps' && /press|dip|push/.test(n)) r.push('Brust', 'Schultern');
  if ((m === 'lats' || m === 'middle back') && !/pullover|straight-arm|rack pull/.test(n)) r.push('Bizeps', 'Schultern');
  if (m === 'shoulders' && /row|face pull|pull apart|rear/.test(n)) r.push('Mittl. Rücken');
  if (m === 'shoulders' && /row/.test(n) && !/rear/.test(n)) r.push('Bizeps');
  if (m === 'biceps' && /curl/.test(n)) r.push('Unterarme');
  if (m === 'quadriceps' && /squat|press|lunge|step/.test(n)) r.push('Gesäß');
  if (m === 'hamstrings' || m === 'lower back') r.push('Gesäß');
  if (m === 'glutes') r.push('Beinbeuger');
  return [...new Set(r)];
}
function muscleLabel(e) {
  const m = MUSCLE_DE[e.muscle] || e.muscle, s = secondaries(e);
  return s.length ? m + ' · ' + s[0] : m;
}
// Gewichtsklassen: Aufwand + sichtbarer Nutzen, je Hauptmuskel (Bereich / Aufbau / Maximum)
const WCLASS = {
  chest: ['im Brustbereich', 'eine breitere Brust', 'maximale Brustbreite'],
  shoulders: ['im Schulterbereich', 'runde, breitere Schultern', 'massive, breite Schultern'],
  biceps: ['an den Oberarmen', 'kräftigere, vollere Arme', 'maximalen Armumfang'],
  triceps: ['an der Armrückseite', 'kräftigere, dickere Arme', 'maximale Armmasse'],
  lats: ['am Rücken', 'einen breiteren Rücken (V-Form)', 'maximale Rückenbreite'],
  'middle back': ['am oberen Rücken', 'einen dickeren, kräftigeren Rücken', 'maximale Rückendicke'],
  'lower back': ['im unteren Rücken', 'einen stabileren Rumpf', 'maximale Rumpfkraft'],
  traps: ['im Nacken-/Schulterbereich', 'einen kräftigeren Nacken-Schulter-Übergang', 'maximale Trapezmasse'],
  quadriceps: ['an den Oberschenkeln', 'kräftigere Oberschenkel', 'maximale Beinmasse'],
  hamstrings: ['an der Beinrückseite', 'kräftigere Beinrückseite', 'maximale Beinrückseite'],
  glutes: ['am Gesäß', 'ein kräftigeres, rundes Gesäß', 'maximales Gesäßvolumen'],
  calves: ['an den Waden', 'kräftigere Waden', 'maximale Wadenmasse'],
  abdominals: ['im Bauchbereich', 'einen definierteren Bauch', 'maximale Bauchdefinition'],
  forearms: ['an den Unterarmen', 'kräftigere Unterarme', 'maximale Griffkraft und Unterarmmasse']
};
function wclassHtml(e) {
  const w = WCLASS[e.muscle] || ['im Zielmuskel', 'Muskelaufbau', 'maximale Kraft'];
  const sec = secondaries(e);
  const row = (t, a, b) => `<div class="xr-wc"><b>${t}</b><span>${a} ${b}</span></div>`;
  return `${sec.length ? `<div class="xr-sec">Zusätzlich beansprucht: ${sec.join(', ')}</div>` : ''}
    <div class="ov-card-title">Gewichtsklassen</div>
    ${row('Leicht', 'Geringer Aufwand bei minimalem Verletzungsrisiko.', `Optisch: Straffung, Definition und bessere Haltung ${w[0]}.`)}
    ${row('Moderat', 'Mittlerer, kontrollierter Aufwand.', `Optisch: effektiver Muskelaufbau (Hypertrophie) für ${w[1]}.`)}
    ${row('Schwer', 'Hoher Aufwand, Fokus auf strikte Technik.', `Optisch: ${w[2]}, massives Volumen und sichtbarer Kraftzuwachs.`)}`;
}
function xrTile(i, act) {
  const e = pool[i];
  return `<button class="xr-tile" data-act="${act}" data-p="${i}">
    <img class="xr-img" src="${esc(imgOf(e))}" alt="" loading="lazy" decoding="async" onerror="this.style.visibility='hidden'">
    <span class="xr-musc">${esc(muscleLabel(e))}</span>
    <span class="xr-eq">${equipBadge(e.name)}</span>
    ${loadFavs().includes(e.name) ? '<i class="xr-star">★</i>' : ''}<span class="xr-name">${esc(dn(e.name))}</span>
  </button>`;
}
function xrPills(withEquip) {
  const p = (act, v, l, on) => `<button class="xr-pill${on ? ' active' : ''}" data-act="${act}" data-v="${v}">${l}</button>`;
  let h = `<div class="xr-pills">${p('fMuscle', '', 'Alle', !filterMuscle)}${MUSCLE_GROUP_LIST.map(g => p('fMuscle', g, g, filterMuscle === g)).join('')}</div>`;
  if (withEquip) h += `<div class="xr-pills xr-pills-sub">${CAT_LIST.map(([k, l]) => p('fCat', k, l, filterCat === k)).join('')}${EQUIP_LIST.map(([k, l]) => p('fEquip', k, l, filterEquip === k)).join('')}</div>`;
  return h;
}
const XR_SEARCH_ICO = '<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

// Übungs-Detailseite (Sheet) – von überall per Tipp auf Foto/Name erreichbar
function equipLabel(name) { const f = EQUIP_LIST.find(([k]) => k !== 'none' && matchesEquip(name, k)); return f ? f[1] : 'Ohne Geräte'; }
const DT_DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
function dtIdx(n) { const i = DT_DAYS.findIndex(d => n === d + 'straining'); return i < 0 ? 7 : i; }
function dtShort(n) { const i = dtIdx(n); return i < 7 ? DT_DAYS[i] : n; }
function dtBadge(n) { const i = dtIdx(n); return i < 7 ? DT_DAYS[i].slice(0, 2) : '+'; }
function dtDayList() { return weekplan.map((t, k) => [t, k]).sort((a, b) => dtIdx(a[0].name) - dtIdx(b[0].name) || a[1] - b[1]).map(x => x[0]); }
function detailSheetHtml(ex) {
  const w = WCLASS[ex.muscle] || ['im Zielmuskel', 'Muskelaufbau', 'maximale Kraft'];
  const sec = secondaries(ex);
  const add = view !== 'play' && view !== 'tv' ? `<div class="dt-sec">Zu Training hinzufügen</div>
    <div class="dt-add">${dtDayList().map(t => { const has = t.exercises.some(e => e.name === ex.name);
      return `<button class="dt-chip${has ? ' on' : ''}" data-act="browseAdd" data-id="${t.id}"><span class="dt-chip-b">${dtBadge(t.name)}</span><span class="dt-chip-t"><b>${esc(dtShort(t.name))}</b><small>${has ? '✓ Hinzugefügt' : (dtIdx(t.name) < 7 ? 'Training' : 'Eigenes Training')}</small></span></button>`; }).join('')}<button class="dt-chip" data-act="browseAddNew"><span class="dt-chip-b">+</span><span class="dt-chip-t"><b>Neues Training</b><small>mit dieser Übung</small></span></button></div>` : '';
  return `<div class="goal-sheet dt-bg" data-act="browseClose"><div class="dt-sheet">
    <button class="dt-x" data-act="browseClose" aria-label="Schließen">✕</button>
    <div class="dt-hero"><img src="${esc(imgOf(ex))}" alt="" onerror="this.style.visibility='hidden'"></div>
    <div class="dt-body">
      <div class="dt-nr"><h2 class="dt-name">${esc(dn(ex.name))}</h2><button class="dt-fav${loadFavs().includes(ex.name) ? ' on' : ''}" data-act="exFav" data-name="${esc(ex.name)}" aria-label="Favorit">${loadFavs().includes(ex.name) ? '★' : '☆'}</button></div>
      <button class="dt-bad${loadBad().includes(ex.name) ? ' on' : ''}" data-act="badImg" data-name="${esc(ex.name)}">${loadBad().includes(ex.name) ? '✓ Bild als falsch markiert' : '⚑ Bild falsch'}</button>
      <div class="dt-tags"><span class="dt-tag on">${esc(MUSCLE_DE[ex.muscle] || ex.muscle)}</span>${MUSCLE_GROUPS[ex.muscle] && MUSCLE_GROUPS[ex.muscle] !== (MUSCLE_DE[ex.muscle] || ex.muscle) ? `<span class="dt-tag">${MUSCLE_GROUPS[ex.muscle]}</span>` : ''}<span class="dt-tag">${equipLabel(ex.name)}</span></div>
      ${sec.length ? `<div class="dt-secm">Zusätzlich: ${sec.join(', ')}</div>` : ''}
      <div class="dt-how">
        ${(anleitungen[ex.name] || {}).schritte ? `<div class="dt-sec">Anleitung</div><ol class="dt-steps">${anleitungen[ex.name].schritte.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
        <div class="dt-res"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><div><small>Resultat</small><b>Straffung, Definition, bessere Haltung ${w[0]}</b></div></div>
      </div>
      ${add}
    </div></div></div>`;
}
function mountDetail() {
  document.querySelectorAll('.dt-bg').forEach(n => n.remove());
  if (browseSel == null || !pool[browseSel]) return;
  content.insertAdjacentHTML('beforeend', detailSheetHtml(pool[browseSel]));
}
function renderAllEx() {
  const chip = (act, v, label, on) => `<button class="chip${on ? ' active' : ''}" data-act="${act}" data-v="${v}">${label}</button>`;
  const active = [
    ...(filterCat ? [['fCat', filterCat, CAT_LIST.find(c => c[0] === filterCat)[1]]] : []),
    ...(filterMus ? [['fMus', filterMus, MUSCLE_DE[filterMus]]] : []),
    ...(filterEquip ? [['fEquip', filterEquip, EQUIP_LIST.find(e => e[0] === filterEquip)[1]]] : [])
  ];
  const nF = active.length;
  const filterSheet = filterOpen ? `<div class="goal-sheet"><div class="goal-edit browse-sheet">
      <div class="ov-card-title">Muskel</div>
      <div class="filter-chips">${Object.entries(MUSCLE_DE).map(([k, l]) => chip('fMus', k, l, filterMus === k)).join('')}</div>
      <div class="ov-card-title">Gerät</div>
      <div class="filter-chips">${EQUIP_LIST.map(([k, l]) => chip('fEquip', k, l, filterEquip === k)).join('')}</div>
      <div class="ov-card-title">Art</div>
      <div class="filter-chips">${CAT_LIST.map(([k, l]) => chip('fCat', k, l, filterCat === k)).join('')}</div>
      <div class="edit-bar"><button class="ov-btn ov-btn-ghost" data-act="fReset">Zurücksetzen</button><button class="ov-btn" data-act="fClose">Fertig</button></div>
    </div></div>` : '';
  const st = content.scrollTop;
  content.innerHTML = `<div class="xr">
      <div class="xr-top">
        <div class="xr-search">${XR_SEARCH_ICO}<input id="q" type="search" placeholder="Übung suchen" value="${esc(browseQ)}" autocomplete="off">
          <button class="xr-filter${nF ? ' on' : ''}" data-act="fOpen">Filter${nF ? `<b>${nF}</b>` : ''}</button></div>
        ${filterMuscle || filterSplit || filterFav ? `<div class="xr-pills"><button class="xr-pill" data-act="fMuscle" data-v="">‹ Zurück</button><button class="xr-pill active" data-act="fMuscle" data-v="${filterMuscle || ''}">${filterFav ? '★ Favoriten' : filterMuscle ? filterMuscle : (filterSplit === 'warm' ? 'Warmup' : (PRESETS.find(p => p.key === filterSplit) || {}).name)}</button></div>` : ''}
        ${nF ? `<div class="xr-pills xr-pills-sub">${active.map(([a, v, l]) => `<button class="xr-pill active" data-act="${a}" data-v="${v}">${l} ✕</button>`).join('')}</div>` : ''}
      </div>
      <div class="xr-count" id="pager-info"></div>
      <div id="results" class="xr-grid"></div>
      <button id="xr-more" class="xr-more" data-act="bMore" hidden></button>
    </div>${filterSheet}`;
  const q = document.getElementById('q');
  q.addEventListener('input', () => { browseQ = q.value; browseLimit = BPAGE; renderResults(q.value); });
  renderResults(browseQ);
  content.scrollTop = st;
  const on = content.querySelector('.xr-pills .xr-pill.active');
  if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' });
}

// V2-03/V4: TV-Modus – eine Übung groß, für Screen-Mirroring/AirPlay auf Apple TV. Nutzt den
// zuletzt aktiven Trainingstag. V4: Einstieg jetzt über das TV-Icon oben rechts (von überall
// im Training aus erreichbar), "Zurück" führt sauber zur vorherigen Ansicht zurück.
function renderTV() {
  const backBtn = `<button class="tv-back" data-act="tvBack">← Zurück</button>`;
  const wt = tvReturn && tvReturn.view === 'wtrain' ? trainingById(tvReturn.wId) : null;
  const items = wt ? wt.exercises : list();
  const title = wt ? wt.name : (DAY_LABELS[day] || day);
  if (!items.length) { content.innerHTML = `<p class="placeholder">Keine Übungen für „${esc(title)}“.</p>${backBtn}`; return; }
  if (tvIndex >= items.length) tvIndex = 0;
  if (tvIndex < 0) tvIndex = items.length - 1;
  const ex = items[tvIndex];
  const n = wt ? (ex.sets || 3) : SETS;
  const wSets = wt ? (wProgRaw().done[wt.id] || {})[ex.name] || [] : null;
  const isDone = k => wt ? !!(wSets[k] && wSets[k].done) : !!setsOf(ex.name)[k];
  const doneN = Array.from({ length: n }, (_, k) => isDone(k)).filter(Boolean).length;
  const seg = items.map((it, i) => `<i class="${i === tvIndex ? 'cur' : ''}"></i>`).join('');
  content.innerHTML = `
    <div class="tv">
      <div class="tv-top">${backBtn}<div class="tv-cnt"><b>${tvIndex + 1}</b> / ${items.length}</div><div class="tv-tt">${esc(title)}</div></div>
      <div class="tv-prog" style="--n:${items.length}">${seg}</div>
      <div class="tv-main">
        <div class="tv-gifbox"><img class="tv-gif" src="${esc(imgOf(ex))}" alt="" onerror="this.style.visibility='hidden'"></div>
        <div class="tv-side">
          <div class="tv-name">${esc(dn(ex.name))}</div>
          <div class="tv-muscle">${esc(MUSCLE_DE[ex.muscle] || ex.muscle)}</div>
          <div class="tv-done"><b>${doneN}</b> / ${n} Sätze</div>
          <div class="tv-sets" style="--n:${n}">${Array.from({ length: n }, (_, k) =>
            `<button class="set${isDone(k) ? ' done' : ''}" data-act="${wt ? 'tvWSet' : 'set'}" data-i="${tvIndex}" data-k="${k}">${isDone(k) ? '✓' : k + 1}</button>`).join('')}</div>
          <div class="tv-nav">
            <button data-act="tvPrev">←</button>
            <button data-act="tvNext">→</button>
          </div>
        </div>
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
// Offline-Fall: fehlgeschlagene Syncs landen in einer Warteschlange und werden beim nächsten Öffnen erneut gesendet.
const SQKEY = 'heimtraining.syncqueue';
function loadQ() { try { return JSON.parse(localStorage.getItem(SQKEY)) || []; } catch (e) { return []; } }
function saveQ(q) { try { localStorage.setItem(SQKEY, JSON.stringify(q.slice(-50))); } catch (e) {} }
function sendOne(body) {
  return fetch(API, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); });
}
function syncSession(body) { sendOne(body).catch(() => saveQ(loadQ().concat([body]))); }
function flushQ() {
  const q = loadQ(); if (!q.length || !navigator.onLine) return;
  saveQ([]); q.forEach(b => sendOne(b).catch(() => saveQ(loadQ().concat([b]))));
}
flushQ();

content.addEventListener('click', e => {
  const btn = e.target.closest('.nm-edit[data-act], button[data-act], .exinfo[data-act], .dt-bg[data-act], .weeklist-card[data-act], .wp-card[data-act], .tr-card[data-act], .history-item[data-act], .hv-card[data-act]');
  if (!btn) return;
  if ((btn.classList.contains('dt-bg') || btn.classList.contains('ps-bg')) && e.target !== btn) return;
  const i = Number(btn.dataset.i);
  const arr = list().slice();
  const xrRefresh = () => { browseLimit = BPAGE; if (view === 'allex') { browsePage = 0; render(); content.scrollTop = 0; } else renderResults(document.getElementById('q').value); };
  if (btn.dataset.act === 'bMore') { browseLimit += BPAGE; renderResults(document.getElementById('q').value); return; }
  if (btn.dataset.act === 'fFav') { filterFav = true; xrRefresh(); return; }
  if (btn.dataset.act === 'exFav') { const f = loadFavs(), k = f.indexOf(btn.dataset.name); if (k >= 0) f.splice(k, 1); else f.push(btn.dataset.name); try { localStorage.setItem(FAVKEY, JSON.stringify(f)); } catch (e2) {} const on = k < 0; btn.classList.toggle('on', on); btn.textContent = on ? '★' : '☆'; return; }
  if (btn.dataset.act === 'fSplit') { filterSplit = btn.dataset.v; xrRefresh(); return; }
  if (btn.dataset.act === 'fMuscle') {
    filterSplit = null; filterFav = false;
    filterMuscle = (filterMuscle === btn.dataset.v) ? null : (btn.dataset.v || null);
    document.querySelectorAll('[data-act="fMuscle"]').forEach(b => b.classList.toggle('active', b.dataset.v === (filterMuscle || '')));
    xrRefresh();
    return;
  }
  if (btn.dataset.act === 'fEquip') {
    filterEquip = (filterEquip === btn.dataset.v) ? null : btn.dataset.v;
    document.querySelectorAll('[data-act="fEquip"]').forEach(b => b.classList.toggle('active', b.dataset.v === filterEquip));
    xrRefresh();
    return;
  }
  if (btn.dataset.act === 'fMus') {
    filterMus = (filterMus === btn.dataset.v) ? null : btn.dataset.v;
    xrRefresh(); return;
  }
  if (btn.dataset.act === 'fReset') { filterSplit = filterMuscle = filterEquip = filterCat = filterMus = null; filterFav = false; xrRefresh(); return; }
  if (btn.dataset.act === 'fOpen') { filterOpen = true; render(); return; }
  if (btn.dataset.act === 'fClose') { filterOpen = false; render(); return; }
  if (btn.dataset.act === 'fCat') {
    filterCat = (filterCat === btn.dataset.v) ? null : btn.dataset.v;
    document.querySelectorAll('[data-act="fCat"]').forEach(b => b.classList.toggle('active', b.dataset.v === filterCat));
    xrRefresh();
    return;
  }
  switch (btn.dataset.act) {
    case 'del':
      if (!confirm(`„${dn(arr[i].name)}“ entfernen?`)) return;
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
    case 'tvWSet': {
      const t = trainingById(tvReturn && tvReturn.wId), ex = t && t.exercises[i], k = Number(btn.dataset.k);
      if (!ex) break;
      const wp = wProgRaw(); const d = wp.done[t.id] = wp.done[t.id] || {};
      const sets = d[ex.name] = d[ex.name] || []; sets[k] = sets[k] || {}; sets[k].done = !sets[k].done;
      saveWProg(wp); pushStart(t.id); break;
    }
    case 'tvPrev': tvIndex--; break;
    case 'tvNext': tvIndex++; break;
    case 'tvBack': view = tvReturn ? tvReturn.view : 'overview'; if (tvReturn && tvReturn.day) day = tvReturn.day; if (tvReturn && tvReturn.wId) wId = tvReturn.wId; tvReturn = null; break;
    case 'goto':
      dashMode = false;
      if (btn.dataset.day) { day = btn.dataset.day; view = 'day'; }
      else if (btn.dataset.view) {
        // Planung öffnen = frischer Start: nichts gewählt außer Zeit (Geräte -> passende Gruppen entstehen durch Antippen)
        if (btn.dataset.view === 'start' && view !== 'start') { plStep = 0; genCfg.plAuto = false; plClassic = false; genCfg.gear = []; genCfg.groups = []; try { localStorage.setItem(GEARKEY, '[]'); } catch (e2) {} }
        view = btn.dataset.view;
      }
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
        const ex = { name: p.name, muscle: p.muscle, gif: p.gif, sets: 3, note: '', unit: defaultUnit(p.name) };
        if (picker.index === null) t.exercises.push(ex); else t.exercises[picker.index] = ex;
        saveWeekplan();
      } else {
        const ex = { name: p.name, muscle: p.muscle, gif: p.gif };
        if (picker.index === null) arr.push(ex); else arr[picker.index] = ex;
        save(arr);
      }
      picker = null; break;
    }
    case 'stStart': prevId = btn.dataset.id; prevKey = null; view = 'preview'; break;
    case 'stPreset': prevKey = btn.dataset.key; prevId = null; view = 'preview'; break;
    case 'prevBack': view = 'start'; break;
    case 'prevGo': {
      if (prevKey) {
        const p = PRESETS.find(x => x.key === prevKey);
        let t = weekplan.find(w => w.presetKey === p.key);
        if (!t) { t = { id: 'w' + Date.now(), name: loserName(), presetKey: p.key, exercises: presetExercises(p), weekdays: [], since: {}, time: '' }; weekplan.push(t); saveWeekplan(); }
        playStart(t.id);
      } else playStart(prevId);
      break;
    }
    case 'prevDelete': {
      const t = trainingById(prevId);
      if (!t || !confirm('Training „' + t.name + '“ löschen?')) return;
      weekplan = weekplan.filter(w => w.id !== prevId); saveWeekplan(); view = 'start'; break;
    }
    case 'stDelete': case 'playDelete': {
      const id = btn.dataset.act === 'playDelete' ? playTid : btn.dataset.id, t = trainingById(id);
      if (!t || !confirm('Training „' + t.name + '“ löschen?')) return;
      weekplan = weekplan.filter(w => w.id !== id); saveWeekplan();
      const wp = wProgRaw(); delete wp.done[id]; saveWProg(wp);
      view = 'start'; break;
    }
    case 'playExit': view = 'overview'; playDrawer = false; break;
    case 'playGo': playIdx = Number(btn.dataset.i); playSelK = null; break;
    case 'playNext': playIdx++; playSelK = null; break;
    case 'playPrev': playIdx--; playSelK = null; break;
    case 'playSel': playSelK = Number(btn.dataset.k); break;
    case 'playOpen': playDrawer = true; break;
    case 'playClose': playDrawer = false; break;
    case 'playEdit': wId = playTid; view = 'wtrain'; playDrawer = false; break;
    case 'playAddSet': { const ex = trainingById(playTid).exercises[playIdx]; ex.sets = Math.min(10, (ex.sets || 3) + 1); saveWeekplan(); break; }
    case 'playSet': {
      const t = trainingById(playTid), ex = t.exercises[playIdx], k = Number(btn.dataset.k);
      const wp = wProgRaw(), d = wp.done[t.id] = wp.done[t.id] || {}, sets = d[ex.name] = d[ex.name] || [];
      sets[k] = sets[k] || {};
      sets[k].done = !sets[k].done;
      if (sets[k].done) {
        if (sets[k].weight == null && (ex.unit || 'kg') !== 'none') { const l = lastWeights(ex.name), pl = (ex.plan || [])[k] || {}; const pre = pl.w ?? (k > 0 && sets[k - 1] ? sets[k - 1].weight : null) ?? l[k] ?? l[l.length - 1]; if (pre != null) sets[k].weight = pre; }
        restEnd = Date.now() + restSec() * 1000; pushStart(t.id);
      } else restEnd = 0;
      playSelK = null; saveWProg(wp); break;
    }
    case 'restAdd': restEnd = Math.max(restEnd, Date.now()) + 15000; break;
    case 'restSkip': restEnd = 0; break;
    case 'summaryDone': summaryRec = null; view = 'overview'; break;
    case 'wMore': { const k = btn.dataset.id + ':' + btn.dataset.i; wOpen.has(k) ? wOpen.delete(k) : wOpen.add(k); break; }
    case 'wSplit': wOpen.add(btn.dataset.id + ':' + btn.dataset.i + ':s'); break;
    case 'wSame': {
      const ex = trainingById(btn.dataset.id).exercises[Number(btn.dataset.i)], n = ex.sets || 3, p0 = (ex.plan || [])[0] || {};
      ex.plan = Array.from({ length: n }, () => ({ w: p0.w ?? null, r: p0.r ?? null }));
      wOpen.delete(btn.dataset.id + ':' + btn.dataset.i + ':s'); saveWeekplan(); break;
    }
    case 'wUnitSet': trainingById(btn.dataset.id).exercises[Number(btn.dataset.i)].unit = btn.dataset.u; saveWeekplan(); break;
    case 'hintOk': helperHide(btn.dataset.id); break;
    case 'helperReset': try { localStorage.removeItem(HELPKEY); } catch (e) {} break;
    case 'wpPreset': { const p = PRESETS.find(x => x.key === btn.dataset.key); if (!p) break; const ex = weekplan.find(w => w.presetKey === p.key); if (ex) { wId = ex.id; view = 'wtrain'; break; } psSheet = { key: p.key, sel: new Set() }; psPick(8); break; }
    case 'psClose': psSheet = null; break;
    case 'psCount': psPick(Number(btn.dataset.v) || 999); break;
    case 'psTog': { const k = Number(btn.dataset.i); psSheet.sel.has(k) ? psSheet.sel.delete(k) : psSheet.sel.add(k); break; }
    case 'psCreate': {
      const p = PRESETS.find(x => x.key === psSheet.key), all = presetAll(p);
      const t = { id: 'w' + Date.now(), name: loserName(), presetKey: p.key, exercises: (sel => warmupsFor(sel).concat(sel))(all.filter((_, i) => psSheet.sel.has(i))), weekdays: [], since: {}, time: '' };
      weekplan.push(t); saveWeekplan(); psSheet = null; wId = t.id; view = 'wtrain'; break;
    }
    case 'wOpen2': wFrom = view === 'trainings' ? 'trainings' : null; wId = btn.dataset.id; view = 'wtrain'; break;
    case 'wDayNew': {
      // Ruhetag angetippt → neues Tagestraining für diesen Wochentag anlegen und direkt öffnen
      const wd = btn.dataset.wd;
      const FULL = { mon: 'Montag', tue: 'Dienstag', wed: 'Mittwoch', thu: 'Donnerstag', fri: 'Freitag', sat: 'Samstag', sun: 'Sonntag' };
      const nm = FULL[wd] + 'straining'; // vorhandene Standard-Trainings Montagstraining … Sonntagstraining
      const existing = weekplan.find(w => w.name === nm);
      if (existing) {
        if (!existing.weekdays.length && btn.dataset.date >= today()) { existing.weekdays = [wd]; existing.since[wd] = today(); saveWeekplan(); }
        wId = existing.id; view = 'wtrain'; picker = null; break;
      }
      const t = { id: 'w' + Date.now(), name: loserName(), exercises: [], weekdays: btn.dataset.date >= today() ? [wd] : [], since: btn.dataset.date >= today() ? { [wd]: today() } : {}, time: '' }; // vergangene Tage nicht einplanen (sonst sofort "verpasst")
      weekplan.push(t); saveWeekplan();
      wId = t.id; view = 'wtrain'; picker = null; break;
    }
    case 'wBack': { const d = trainingById(btn.dataset.id || wId); if (d && d.draft) weekplan = weekplan.filter(x => x !== d); view = wFrom === 'trainings' ? 'trainings' : 'weeklist'; wFrom = null; picker = null; break; }
    case 'wpDay': wpSheet = { wd: btn.dataset.wd, date: btn.dataset.date }; break;
    case 'wpClose': if (e.target.closest('.wps') && !btn.matches('.ov-btn,.wps-x')) return; wpSheet = null; break;
    case 'wpAssign': { const t = trainingById(btn.dataset.id), wd = wpSheet && wpSheet.wd; if (t && wd) { if (!t.weekdays.includes(wd)) t.weekdays.push(wd); t.since = t.since || {}; t.since[wd] = wpSheet.date >= today() ? today() : wpSheet.date; saveWeekplan(); } wpSheet = null; break; }
    case 'wpNew': { const wd = wpSheet && wpSheet.wd, date = wpSheet && wpSheet.date; wpSheet = null; btn.dataset.wd = wd; btn.dataset.date = date; return (function () { const t = { id: 'w' + Date.now(), name: loserName(), exercises: [], weekdays: date >= today() ? [wd] : [], since: date >= today() ? { [wd]: today() } : {}, time: '' }; weekplan.push(t); saveWeekplan(); wId = t.id; view = 'wtrain'; picker = null; render(); })(); }
    case 'wNewTraining': newDraft(); break;
    case 'wNewTrainingCancel': addingTraining = false; break;
    case 'wNewTrainingSave': {
      const name = (document.getElementById('new-training-name')?.value || '').trim();
      if (!name) return;
      const t = { id: 'w' + Date.now(), name: loserName(), exercises: [], weekdays: [], since: {}, time: '' };
      weekplan.push(t); saveWeekplan();
      addingTraining = false; wId = t.id; view = 'wtrain'; break;
    }
    case 'wRename': renameId = btn.dataset.id; break;
    case 'tName': wId = btn.dataset.id; renameId = btn.dataset.id; view = 'wtrain'; break;
    case 'wRenameCancel': { const d = trainingById(btn.dataset.id); if (d && d.draft) { weekplan = weekplan.filter(x => x !== d); view = 'weeklist'; } renameId = null; break; }
    case 'wRenameSave': {
      const name = (document.getElementById('rename-input')?.value || '').trim();
      if (!name) return;
      { const tt = trainingById(btn.dataset.id); tt.name = name; delete tt.draft; } saveWeekplan();
      renameId = null; break;
    }
    case 'wMoveEx': { const t = trainingById(btn.dataset.id), i = Number(btn.dataset.i), j = i + Number(btn.dataset.d);
      if (j < 0 || j >= t.exercises.length) return; [t.exercises[i], t.exercises[j]] = [t.exercises[j], t.exercises[i]]; saveWeekplan(); break; }
    case 'txTo': txTo = { id: btn.dataset.id, i: Number(btn.dataset.i), mv: false }; break;
    case 'txToClose': txTo = null; break;
    case 'txToMode': if (txTo) txTo.mv = btn.dataset.v === '1'; break;
    case 'txToPick': {
      const src = txTo && trainingById(txTo.id), ex = src && src.exercises[txTo.i]; if (!ex) { txTo = null; break; }
      let tg;
      if (btn.dataset.tid === 'new') { tg = { id: 'w' + Date.now(), name: loserName(), exercises: [], weekdays: [], since: {}, time: '' }; weekplan.push(tg); }
      else tg = trainingById(btn.dataset.tid);
      if (tg && !tg.exercises.some(x => x.name === ex.name)) { tg.exercises.push(JSON.parse(JSON.stringify(ex))); if (txTo.mv) src.exercises.splice(txTo.i, 1); saveWeekplan(); txTo = null; }
      else if (tg) return;
      break;
    }
    case 'wRemoveEx': {
      const t = trainingById(btn.dataset.id);
      if (!confirm(`„${dn(t.exercises[Number(btn.dataset.i)].name)}“ entfernen?`)) return;
      t.exercises.splice(Number(btn.dataset.i), 1); saveWeekplan(); break;
    }
    case 'ctlToggle': ctlOpen = !ctlOpen; break;
    case 'wLevel': { const t = trainingById(btn.dataset.id); const miss = applyLevel(t, Number(btn.dataset.lv)); lvMsg = miss ? 'Trage dein Gewicht im Profil ein, dann fülle ich auch die kg vor.' : ''; break; }
    case 'profLang': { const p = loadProfile(); p.lang = btn.dataset.v; saveProfile(p); break; }
    case 'profGender': { const p = loadProfile(); p.gender = btn.dataset.v; saveProfile(p); break; }
    case 'profLevel': { const p = loadProfile(); p.level = Number(btn.dataset.v); saveProfile(p); break; }
    case 'lvlUp': { const p = loadProfile(); p.level = Number(btn.dataset.lv); saveProfile(p); break; }
    case 'genOpen': genFrom = view === 'weeklist' ? 'weeklist' : null; genRes = null; if (view !== 'start') genCfg = newGenCfg(); view = 'gen'; break;
    case 'genBack': view = genFrom || 'start'; genFrom = null; break;
    case 'genPickOpen': genPick = Number(btn.dataset.i); break;
    case 'genPickClose': genPick = -1; break;
    case 'genPickDo': genPickSet(btn.dataset.name); break;
    case 'genLv': genCfg.lv = Number(btn.dataset.v); genRes = null; break;
    case 'genGoal': genCfg.goal = btn.dataset.v; genRes = null; break;
    case 'genCnt': genCfg.count = Number(btn.dataset.v) || null; genRes = null; break;
    case 'plDur': { genCfg.dur = Number(btn.dataset.v); genRes = null; btn.classList.add('picked'); btn.parentNode.classList.add('chosen'); try { navigator.vibrate && navigator.vibrate(15); } catch (x) {}
      setTimeout(() => plJump(1), 420); return; }
    case 'plNext': plJump(plStep + 1); return;
    case 'plTo': plJump(Number(btn.dataset.v)); return;
    case 'plSpots': plSpots = !plSpots; break;
    case 'plClassic': plClassic = !plClassic; break;
    case 'genDur': genCfg.dur = Number(btn.dataset.v); genRes = null; break;
    case 'genGrp': { // Reihenfolge Zeit -> Geräte -> Muskeln: Muskeln nur wählbar, wenn ein gewähltes Gerät Übungen dafür hat
      const m = btn.dataset.v, G = genCfg.groups;
      if (!G.includes(m) && grpConflict(m, G)) { const c = grpConflict(m, G); plMsg = 'Geht nicht mit ' + c + ' (Push/Pull getrennt). Erst ' + c + ' abwählen.'; break; } // Push/Pull-Trennung
      if (!m.startsWith('m:') && view === 'start') { const gcn = groupCounts(); if (!genCfg.gear.length || !gcn[m]) { plMsg = genCfg.gear.length ? 'Dafür gibt es mit deinen Geräten keine Übung. Geh zurück (Chip oben) und wähl ein Gerät dazu.' : 'Wähl zuerst Geräte (Schritt 2), dann passen die Muskeln.'; break; } }
      const i = G.indexOf(m); if (i >= 0) G.splice(i, 1); else G.push(m);
      genCfg.autoAdded = []; autoGear(); genRes = null; break; }
    case 'genGear': { const k = btn.dataset.v, g = loadGear(), i = g.indexOf(k); if (i >= 0) g.splice(i, 1); else g.push(k); genCfg.gear = g; try { localStorage.setItem(GEARKEY, JSON.stringify(g)); } catch (e2) {}
      if (view === 'start') { const gcn = g.length ? groupCounts() : {}; genCfg.groups = genCfg.groups.filter(m => m.startsWith('m:') || gcn[m]); } // Muskeln ohne Übung für die gewählten Geräte fallen raus
      genCfg.autoAdded = []; autoGear(); genRes = null; break; }
    case 'genMinS': genCfg.minSets = Number(btn.dataset.v); genRes = null; break;
    case 'genMinR': genCfg.minReps = Number(btn.dataset.v); genRes = null; break;
    case 'dash': dashMode = true; view = 'overview'; break;
    case 'genDo': if (!genCfg.gear.length) genCfg.gear = GEAR.map(x => x[0]); if (!genCfg.groups.length) { const gcn = groupCounts(); genCfg.groups = shuffle(MUSCLE_GROUP_LIST.filter(m => gcn[m])).slice(0, 2 + Math.floor(Math.random() * 2)); } autoGear(); if (view === 'start') { genFrom = null; view = 'gen'; } generate(); break;
    case 'genNext': { const np = nextPlan(); genCfg.groups = np.groups.slice(); if (!genCfg.gear.length) genCfg.gear = GEAR.map(x => x[0]); autoGear(); genFrom = null; if (view === 'start') view = 'gen'; generate(); if (genRes && genRes.length) { applyProgression(genRes); genNote = np.note; } break; }
    case 'genSurprise': { const gl = shuffle(MUSCLE_GROUP_LIST).slice(0, 2 + Math.floor(Math.random() * 2)); genCfg.groups = gl; generate(); break; }
    case 'genSave': genSave(false); break;
    case 'genGo': genSave(true); break;
    case 'wSetsAdj': {
      const t = trainingById(btn.dataset.id), ex = t.exercises[Number(btn.dataset.i)];
      const next = (ex.sets || 3) + Number(btn.dataset.d);
      if (next < 1 || next > 10) return;
      ex.sets = next;
      if (Number(btn.dataset.d) > 0) { ex.plan = ex.plan || []; ex.plan[next - 1] = { ...(ex.plan[next - 2] || {}) }; }
      saveWeekplan(); break;
    }
    case 'wSetDone': {
      const t = trainingById(btn.dataset.id), ex = t.exercises[Number(btn.dataset.i)], k = Number(btn.dataset.k);
      const wp = wProgRaw();
      const d = wp.done[t.id] = wp.done[t.id] || {};
      const sets = d[ex.name] = d[ex.name] || [];
      sets[k] = sets[k] || {};
      sets[k].done = !sets[k].done;
      saveWProg(wp); if (sets[k].done) pushStart(t.id); break;
    }
    case 'wAddEx': picker = { index: null, wid: btn.dataset.id }; filterMuscle = null; filterEquip = null; filterCat = null; break;
    case 'wFinish': { const rec = finishTraining(trainingById(btn.dataset.id)); if (!rec) return; view = 'weeklist'; break; }
    case 'playFinish': { const rec = finishTraining(trainingById(playTid)); if (!rec) return; summaryRec = rec; restEnd = 0; playDrawer = false; view = 'summary'; break; }
    case 'wDayToggle': {
      const t = trainingById(btn.dataset.id), wd = btn.dataset.wd;
      const idx = t.weekdays.indexOf(wd);
      if (idx === -1) { t.weekdays.push(wd); (t.since = t.since || {})[wd] = today(); } else t.weekdays.splice(idx, 1);
      saveWeekplan(); break;
    }
    case 'wUnsched': { const t = trainingById(btn.dataset.id); t.weekdays = t.weekdays.filter(x => x !== btn.dataset.wd); saveWeekplan(); break; }
    case 'exInfo': { const k = pool.findIndex(x => x.name === btn.dataset.name); if (k >= 0) browseSel = k; break; }
    case 'txToggle': txOpen = txOpen === btn.dataset.key ? null : btn.dataset.key; break;
    case 'browsePick': browseSel = Number(btn.dataset.p); break;
    case 'badImg': { const l = loadBad(), n = btn.dataset.name, k = l.indexOf(n); if (k >= 0) l.splice(k, 1); else l.push(n); try { localStorage.setItem(BADKEY, JSON.stringify(l)); } catch (e) {} break; }
    case 'badCopy': { const t = loadBad().join('\n'); try { navigator.clipboard.writeText(t); btn.textContent = '✓ Kopiert'; } catch (e) { prompt('Liste:', t); } return; }
    case 'browseClose': browseSel = null; break;
    case 'browseAddNew': {
      const ex = pool[browseSel]; if (!ex) break;
      weekplan.push({ id: 'w' + Date.now(), name: loserName(), exercises: [{ name: ex.name, muscle: ex.muscle, gif: ex.gif, sets: 3, note: '', unit: defaultUnit(ex.name) }], weekdays: [], since: {}, time: '' }); saveWeekplan(); break;
    }
    case 'browseAdd': {
      const t = trainingById(btn.dataset.id), ex = pool[browseSel];
      if (t && ex && !t.exercises.some(e => e.name === ex.name)) { t.exercises.push({ name: ex.name, muscle: ex.muscle, gif: ex.gif, sets: 3, note: '', unit: defaultUnit(ex.name) }); saveWeekplan(); }
      break;
    }
    case 'wSavePack': { const dt = trainingById(wId); if (dt && dt.draft && dt.exercises.length) delete dt.draft; } saveWeekplan(); trTab = 'act'; view = 'trainings'; break;
    case 'wStart': playStart(btn.dataset.id); break;
    case 'wSkip': { const t = trainingById(btn.dataset.id); (t.skipped = t.skipped || []).push(btn.dataset.date); saveWeekplan(); break; }
    case 'appReload': {
      Promise.all([navigator.serviceWorker ? navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.unregister()))) : 0, window.caches ? caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k)))) : 0]).catch(() => {}).then(() => location.reload());
      return;
    }
    case 'trTab': trTab = btn.dataset.v; break;
    case 'trFav': { const t = trainingById(btn.dataset.id); if (t) { t.fav = !t.fav; if (t.draft && t.exercises.length) delete t.draft; saveWeekplan(); } break; }
    case 'archToggle': archOpen = !archOpen; break;
    case 'wRestore': { const ar = loadArchive(), t = ar.find(x => x.id === btn.dataset.id); if (t) { saveArchive(ar.filter(x => x.id !== t.id)); weekplan.push(t); saveWeekplan(); } break; }
    case 'trDel': {
      // Zwei-Tipp-Löschen: 1. Tipp = rot "Löschen?", 2. Tipp (innerhalb 3 s) = weg. Verlauf bleibt.
      if (!btn.classList.contains('arm')) { btn.classList.add('arm'); btn.dataset.t = setTimeout(() => btn.classList.remove('arm'), 3000); return; }
      clearTimeout(Number(btn.dataset.t)); const id = btn.dataset.id;
      if (trTab === 'arch') saveArchive(loadArchive().filter(x => x.id !== id)); else { weekplan = weekplan.filter(w => w.id !== id); saveWeekplan(); }
      break;
    }
    case 'wDelete': {
      const t = trainingById(btn.dataset.id);
      if (!confirm(`Training „${t.name}“ löschen? (Verlauf bleibt erhalten)`)) return;
      weekplan = weekplan.filter(w => w.id !== t.id); saveWeekplan(); wId = null; view = wFrom === 'trainings' ? 'trainings' : 'weeklist'; break;
    }
    case 'histDelete': {
      if (!confirm('Verlaufseintrag löschen?')) return;
      const h = loadHistory(); h.splice(histDetailIdx, 1);
      try { localStorage.setItem(HKEY, JSON.stringify(h)); } catch (e2) {}
      view = 'history'; break;
    }
    case 'backupExport': {
      const o = {}; for (let n = 0; n < localStorage.length; n++) { const k = localStorage.key(n); if (k && k.startsWith('heimtraining.')) o[k] = localStorage.getItem(k); }
      const txt = JSON.stringify(o); const ta = document.getElementById('backup-text'); ta.classList.add('show'); ta.value = txt; ta.select();
      try { navigator.clipboard.writeText(txt); } catch (e2) {}
      return;
    }
    case 'backupImport': {
      const ta2 = document.getElementById('backup-text');
      if (!ta2.classList.contains('show')) { ta2.classList.add('show'); ta2.value = ''; ta2.focus(); return; }
      try {
        const o = JSON.parse(ta2.value);
        const keys = Object.keys(o).filter(k => k.startsWith('heimtraining.'));
        if (!keys.length) throw new Error('leer');
        if (!confirm(`${keys.length} Datensätze wiederherstellen? Aktuelle Daten werden überschrieben.`)) return;
        keys.forEach(k => localStorage.setItem(k, o[k]));
        location.reload();
      } catch (e2) { alert('Kein gültiges Backup.'); }
      return;
    }
    case 'goalEdit': goalEditing = true; break;
    case 'goalEditFromProfile': goalEditing = true; view = 'overview'; break;
    case 'goalSave': {
      const target = Math.max(1, Number(document.getElementById('goal-target')?.value) || 1);
      const mult = { tage: 1, wochen: 7, monate: 30, jahre: 365 }[document.getElementById('goal-unit')?.value] || 1;
      const periodDays = Math.max(1, Math.round((Number(document.getElementById('goal-period')?.value) || 1) * mult));
      saveGoal({ target, periodDays }); goalEditing = false; break;
    }
    case 'goalCancel': goalEditing = false; break;
    case 'longEdit': longEditing = true; longDraftType = null; break;
    case 'longType': longDraftType = btn.dataset.v; break;
    case 'longCancel': longEditing = false; longDraftType = null; break;
    case 'longSave': {
      const ty = longDraftType || loadLong().type, g = id => document.getElementById(id)?.value;
      if (false) {
        const ex = (g('lg-ex') || '').trim(), from = Number(g('lg-from')) || 0, to = Number(g('lg-to')) || 0;
        if (ex && to > from) saveLong({ type: 'strength', ex, from, to });
      } else saveLong({ type: 'count', target: Math.max(1, Number(g('lg-target')) || 156), per: g('lg-per') === 'month' ? 'month' : 'year' });
      longEditing = false; longDraftType = null; break;
    }
    case 'quickStart': playStart(btn.dataset.id); picker = null; break;
    case 'histOpen': histDetailIdx = Number(btn.dataset.idx); view = 'histdetail'; break;
    case 'histBack': view = 'history'; break;
  }
  render();
});

content.addEventListener('change', e => {
  const u = e.target.closest('[data-act="wUnit"]');
  if (!u) return;
  trainingById(u.dataset.id).exercises[Number(u.dataset.i)].unit = u.value;
  saveWeekplan(); render();
});

content.addEventListener('input', e => {
  const profileEl = e.target.closest('[data-act="profileField"]');
  if (profileEl) {
    const p = loadProfile();
    p[profileEl.dataset.field] = ['gender', 'name'].includes(profileEl.dataset.field) ? profileEl.value : (profileEl.value === '' ? null : Number(profileEl.value));
    saveProfile(p);
    return;
  }
  const allEl = e.target.closest('[data-act="wPlanAll"]');
  if (allEl) {
    const ex = trainingById(allEl.dataset.id).exercises[Number(allEl.dataset.i)], v = allEl.value === '' ? null : Number(allEl.value);
    ex.plan = ex.plan || [];
    for (let k = 0; k < (ex.sets || 3); k++) { ex.plan[k] = ex.plan[k] || {}; ex.plan[k][allEl.dataset.f] = v; }
    saveWeekplan(); return;
  }
  const planEl = e.target.closest('[data-act="wPlan"]');
  if (planEl) {
    const ex = trainingById(planEl.dataset.id).exercises[Number(planEl.dataset.i)], k = Number(planEl.dataset.k);
    ex.plan = ex.plan || []; ex.plan[k] = ex.plan[k] || {};
    ex.plan[k][planEl.dataset.f] = planEl.value === '' ? null : Number(planEl.value);
    saveWeekplan(); return;
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
    saveWProg(wp); if (el.value !== '') pushStart(t.id);
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
  else newDraft();
  render();
});

// V4-02: TV-Icon oben rechts – von überall im Training erreichbar, merkt sich die
// vorherige Ansicht für den "Zurück"-Button in der TV-Ansicht.
document.getElementById('tvIconBtn').addEventListener('click', () => {
  tvReturn = { view, day, wId };
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

// Beim Zurückkehren in die App (z. B. nach Mitternacht) Ansicht + Stimmung neu berechnen – nicht beim Tippen/Picker.
let lastDay = today();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  flushQ();
  if (today() !== lastDay && !picker && !document.activeElement?.matches('input,textarea,select')) { lastDay = today(); render(); }
});

// Enter speichert Name (neues Training / Umbenennen)
content.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const id = e.target && e.target.id;
  const btn = id === 'new-training-name' ? content.querySelector('[data-act="wNewTrainingSave"]') : id === 'rename-input' ? content.querySelector('[data-act="wRenameSave"]') : null;
  if (btn) { e.preventDefault(); btn.click(); }
});

// Player-Gesten: nach oben wischen = Details, nach unten = zu, seitlich = Übung wechseln
let _tx = 0, _ty = 0;
content.addEventListener('touchstart', e => { _tx = e.touches[0].clientX; _ty = e.touches[0].clientY; }, { passive: true });
content.addEventListener('touchend', e => {
  if ((view !== 'play' && view !== 'tv') || !e.changedTouches[0]) return;
  const dx = e.changedTouches[0].clientX - _tx, dy = e.changedTouches[0].clientY - _ty;
  const go = a => { const b = document.createElement('button'); b.dataset.act = a; content.appendChild(b); b.click(); b.remove(); };
  if (view === 'tv') { if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 'tvNext' : 'tvPrev'); return; }
  if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx)) { if (dy < 0 && !playDrawer) go('playOpen'); else if (dy > 0 && playDrawer && !e.target.closest('input')) go('playClose'); }
  else if (!playDrawer && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) go('playNext'); else go('playPrev'); }
}, { passive: true });

// Wischen auf eigenen Trainings: rechts = Archiv, links = Löschen
let _sw = null, _swDone = 0;
content.addEventListener('touchstart', e => {
  const w = e.target.closest('.wp-sw'); if (!w || e.touches.length !== 1) { _sw = null; return; }
  _sw = { w, card: w.querySelector('.wp-card, .tr-card'), x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, lock: '' };
}, { passive: true });
content.addEventListener('touchmove', e => {
  if (!_sw) return;
  const dx = e.touches[0].clientX - _sw.x, dy = e.touches[0].clientY - _sw.y;
  if (!_sw.lock) { if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.5) _sw.lock = 'h'; else if (Math.abs(dy) > 8) { _sw = null; return; } else return; }
  e.preventDefault(); _sw.dx = dx;
  _sw.card.style.transition = 'none'; _sw.card.style.transform = `translateX(${dx}px)`;
  _sw.w.dataset.dir = dx > 0 ? 'r' : 'l';
}, { passive: false });
content.addEventListener('touchend', () => {
  if (!_sw) return;
  const { w, card, dx, lock } = _sw; _sw = null;
  if (lock !== 'h') return;
  _swDone = Date.now();
  const id = w.dataset.sw, TH = Math.min(110, w.offsetWidth * 0.3);
  card.style.transition = 'transform .2s'; 
  if (Math.abs(dx) < TH) { card.style.transform = ''; return; }
  card.style.transform = `translateX(${dx > 0 ? '110%' : '-110%'})`;
  setTimeout(() => {
    const t = weekplan.find(x => x.id === id);
    if (!t) { render(); return; }
    if (dx > 0) { const ar = loadArchive(); ar.push(t); saveArchive(ar); weekplan = weekplan.filter(x => x.id !== id); saveWeekplan(); }
    else if (confirm(`Training „${t.name}“ löschen? (Verlauf bleibt erhalten)`)) { weekplan = weekplan.filter(x => x.id !== id); saveWeekplan(); }
    render();
  }, 180);
});
// Wischen in der Auto-Ergebnisliste: Übung tauschen
let _gs = null;
content.addEventListener('touchstart', e => {
  const w = e.target.closest('.gn-sw, .tx-sw'); if (!w || e.touches.length !== 1) { _gs = null; return; }
  _gs = { w, card: w.querySelector('.gn-ex, .tx-row'), x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, lock: '' };
}, { passive: true });
content.addEventListener('touchmove', e => {
  if (!_gs) return;
  const dx = e.touches[0].clientX - _gs.x, dy = e.touches[0].clientY - _gs.y;
  if (!_gs.lock) { if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.5) _gs.lock = 'h'; else if (Math.abs(dy) > 8) { _gs = null; return; } else return; }
  e.preventDefault(); _gs.dx = dx; _gs.card.style.transition = 'none'; _gs.card.style.transform = `translateX(${dx}px)`; _gs.w.dataset.dir = dx > 0 ? 'r' : 'l';
}, { passive: false });
content.addEventListener('touchend', () => {
  if (!_gs) return;
  const { w, card, dx, lock } = _gs; _gs = null;
  if (lock !== 'h') return;
  _swDone = Date.now();
  card.style.transition = 'transform .18s';
  if (Math.abs(dx) < Math.min(90, w.offsetWidth * 0.25)) { card.style.transform = ''; return; }
  card.style.transform = dx > 0 ? '' : 'translateX(-110%)';
  setTimeout(() => { if (w.dataset.tsw) { const [tid, ti] = w.dataset.tsw.split('|'); if (dx > 0) wFavEx(trainingById(tid), Number(ti)); else wSwapEx(trainingById(tid), Number(ti)); } else if (dx > 0) genFav(Number(w.dataset.gsw)); else genSwap(Number(w.dataset.gsw)); render(); }, 170);
});
// START = Halten (0,9 s) mit Ring; kurzes Tippen startet nicht
(function () {
  let tm = 0, cur = null;
  const stop = () => { clearTimeout(tm); if (cur && !cur._ok) cur.classList.remove('hold'); cur = null; };
  content.addEventListener('pointerdown', e => {
    const b = e.target.closest && e.target.closest('.home-btn'); if (!b || b._ok) return;
    cur = b; b.classList.add('hold');
    try { b.setPointerCapture(e.pointerId); } catch (x) {}
    tm = setTimeout(() => { b._ok = true; b.classList.remove('hold'); b.classList.add('done'); for (let i = 0; i < 2; i++) { const r = document.createElement('span'); r.className = 'home-ring rb'; r.style.animationDelay = (i * .12) + 's'; b.appendChild(r); } try { navigator.vibrate && navigator.vibrate(30); } catch (x) {} setTimeout(() => b.click(), 420); }, 900);
  });
  ['pointerup', 'pointercancel'].forEach(n => content.addEventListener(n, stop));
  content.addEventListener('pointermove', e => { if (!cur) return; const r = cur.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) stop(); });
  ['contextmenu', 'selectstart'].forEach(n => content.addEventListener(n, e => { if (e.target.closest && e.target.closest('.home-btn')) e.preventDefault(); }));
  content.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.home-btn'); if (b && !b._ok) { e.stopPropagation(); e.preventDefault(); const h = content.querySelector('.home-hint'); if (h) { h.classList.remove('nudge'); void h.offsetWidth; h.classList.add('nudge'); } } }, true);
})();
content.addEventListener('click', e => { if (Date.now() - _swDone < 400) { e.stopPropagation(); e.preventDefault(); } }, true);
// Schnellwahl-Chips: setzen/addieren, Fokus im Feld behalten (Tastatur bleibt)
content.addEventListener('pointerdown', e => { if (e.target.closest('.qc button')) e.preventDefault(); });
content.addEventListener('click', e => {
  const b = e.target.closest('.qc button[data-qv]'); if (!b) return;
  const box = b.closest('.qc'), scope = b.closest('.xc, .pf-sheet') || content;
  const inp = scope.querySelector(box.dataset.target); if (!inp) return;
  const v = Number(b.dataset.qv), cur = Number(inp.value) || 0;
  inp.value = b.dataset.mode === 'add' ? cur + v : v;
  inp.dispatchEvent(new Event('input', { bubbles: true }));
});

document.addEventListener('input', e => { if (e.target.id === 'gen-name') { genCfg.name = e.target.value; return; } if (e.target.id !== 'gp-q') return; const q = e.target.value.toLowerCase().trim(); document.querySelectorAll('.gp-r').forEach(b => { b.style.display = !q || b.dataset.q.includes(q) ? '' : 'none'; }); });

// Auto-Update: beim Zurückkehren in die App prüfen, ob eine neuere Version live ist, dann neu laden
(function () {
  const cur = (document.querySelector('script[src^="script.js"]') || {}).src || '';
  const chk = () => fetch('index.html', { cache: 'no-store' }).then(r => r.text()).then(t => { const m = t.match(/script\.js\?v=([0-9A-Za-z]+)/); if (m && cur && !cur.endsWith('v=' + m[1]) && !document.getElementById('gp-root')) location.reload(); }).catch(() => {});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) chk(); });
  setTimeout(chk, 3000);
})();

// Sonar-Puls (BTN-05): Tipp auf START löst zusätzlichen Ring aus
document.addEventListener('pointerdown', e => {
  const b = e.target.closest && e.target.closest('.home-btn');
  if (!b || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const r = document.createElement('span'); r.className = 'home-ring rb'; b.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
}, { passive: true });

// Kein Textmarkieren per Langdruck (außer in Eingabefeldern)
document.addEventListener('selectstart', e => { if (!(e.target.closest && e.target.closest('input,textarea,[contenteditable="true"]'))) e.preventDefault(); });

content.addEventListener('click', e => { if (wpSheet && e.target.classList && e.target.classList.contains('goal-sheet')) { wpSheet = null; render(); } });
