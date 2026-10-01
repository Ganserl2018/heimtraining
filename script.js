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
function loadWeekplan() {
  try {
    const raw = JSON.parse(localStorage.getItem(WKEY));
    if (Array.isArray(raw) && raw.length) return raw;
  } catch (e) {}
  return WEEKDAY_SEED.map(([id, name]) => ({ id, name, exercises: [] }));
}
function saveWeekplan() { try { localStorage.setItem(WKEY, JSON.stringify(weekplan)); } catch (e) {} }
weekplan = loadWeekplan().filter(x => !x.draft);
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
    const match = t.dataset.view ? (t.dataset.view === view || (t.dataset.view === 'overview' && view === 'start' && !matchMedia('(min-width:820px)').matches) || (t.dataset.view === 'history' && view === 'histdetail') || (t.dataset.view === 'weeklist' && view === 'wtrain')) : (view === 'day' && t.dataset.day === day);
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

// V9-14: Gesamtstimmung (grün/rot) gilt für die ganze App, nicht nur die Übersicht
function applyMood() {
  const t = today();
  const ws = mondayOf(t);
  const bad = weekplan.some(w => w.weekdays && w.weekdays.length && Array.from({ length: 7 }, (_, i) => addDays(ws, i))
    .some(ds => trainingStatusForDate(w, ds) === 'verpasst'));
  document.body.classList.toggle('mood-bad', bad);
  document.body.classList.toggle('mood-good', !bad);
}

function render() {
  if (weekplan.some(x => x.draft && !(view === 'wtrain' && wId === x.id) && view !== 'picker' && !picker)) weekplan = weekplan.filter(x => !x.draft || (view === 'wtrain' && wId === x.id));
  applyMood();
  const titles = { overview: 'Home Force', history: 'Verlauf', histdetail: 'Verlauf', weeklist: 'Wochenplan', start: 'Training wählen', play: 'Workout', preview: 'Training', summary: 'Geschafft', allex: 'Alle Übungen', profile: 'Profil', tv: 'TV-Ansicht', day: DAY_LABELS[day] || 'Training' };
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
  if (view === 'start') return renderStart();
  if (view === 'preview') return renderPreview();
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
  const hay = deNorm(ex.name + ' ' + ex.muscle + ' ' + (MUSCLE_DE[ex.muscle] || '') + ' ' + (MUSCLE_GROUPS[ex.muscle] || '')) + ' ';
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
    if (filterEquip && !matchesEquip(ex.name, filterEquip)) return;
    if (filterCat && ex.category !== filterCat) return;
    if (filterMus && ex.muscle !== filterMus) return;
    hits.push(i);
  });
  if (view === 'allex') {
    const pages = Math.max(1, Math.ceil(hits.length / browsePer));
    browsePage = Math.min(Math.max(browsePage, 0), pages - 1);
    const slice = hits.slice(browsePage * browsePer, (browsePage + 1) * browsePer);
    document.getElementById('results').innerHTML = slice.map(i => `
      <button class="result" data-act="browsePick" data-p="${i}">
        <img class="result-gif" src="${esc(pool[i].gif)}" alt="" onerror="this.style.visibility='hidden'">
        <span class="result-info"><span class="exercise-name">${esc(pool[i].name)}</span><span class="exercise-muscle">${esc(MUSCLE_DE[pool[i].muscle] || pool[i].muscle)}</span></span>
      </button>`).join('') + (hits.length === 0 ? '<p class="placeholder">Keine Treffer – Filter/Suche anpassen.</p>' : '');
    const info = document.getElementById('pager-info');
    if (info) info.textContent = hits.length ? `Seite ${browsePage + 1} / ${pages} · ${hits.length} Übungen` : '0 Übungen';
    return;
  }
  document.getElementById('results').innerHTML = hits.slice(0, view === 'allex' ? 90 : 60).map(i => `
    <button class="result" data-act="${view === 'allex' ? 'browsePick' : 'pick'}" data-p="${i}">
      <img class="result-gif" src="${esc(pool[i].gif)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
      <span class="result-info">
        <span class="exercise-name">${esc(pool[i].name)}</span>
        <span class="exercise-muscle">${esc(pool[i].muscle)}</span>
      </span>
    </button>`).join('') + (hits.length === 0 ? '<p class="placeholder">Keine Treffer – Filter/Suche anpassen.</p>' : '') +
    (hits.length > (view === 'allex' ? 90 : 60) ? `<p class="placeholder">${hits.length - (view === 'allex' ? 90 : 60)} weitere – Suche verfeinern.</p>` : '');
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

function renderOverview() {
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
    const sub = !worst ? '(Ruhe)' : worst === 'verpasst' ? '⚠' : worst === 'unvollständig' ? '!' : DB;
    const target = (items.find(x => x.status !== 'erledigt') || items[0] || {}).w;
    const act = target ? `data-act="wOpen2" data-id="${target.id}"` : `data-act="wDayNew" data-wd="${wdKeyOf(ds)}" data-date="${ds}"`;
    return `<button class="lab-day${worst ? ' lab-' + worst : ''}${worst && worst !== 'verpasst' ? (hasEx ? ' lab-ex' : ' lab-leer') : ''}${ds === t ? ' lab-heute' : ''}" ${act}><b>${WD_LABELS[wdKeyOf(ds)]}</b><span>${sub}</span></button>`;
  }).join('');

  content.innerHTML = `
    <div class="overview overview-lab ${mood}">
      <div class="lab-head">
        <div>
          <div class="lab-head-title">HOME FORCE – ZUSTAND:<br>${moodTitle}</div>
          <div class="lab-head-sub"><i></i>${moodSub}</div>
        </div>
        <button class="lab-badge" data-act="goto" data-view="profile" aria-label="Profil">${(loadProfile().name || '').trim().charAt(0).toUpperCase() || '◉'}</button>
      </div>
      ${ringBlock}
      <button class="lab-goal-link" data-act="goalEdit">Ziel anpassen</button>
      <div class="lab-streak">STREAK: ${streak} TAG${streak === 1 ? '' : 'E'}${hasMissedThisWeek ? ' (KRITISCH)' : ''} 🔥</div>
      <button class="lab-start${hasMissedThisWeek ? ' lab-start-broken' : ''}" ${startAttr}>
        <svg class="lab-start-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><span>${startLabel}<small>${quick ? btnSub : ''}</small></span>
      </button>
      <div class="lab-section">WOCHENPLAN-STREIFEN</div>
      <div class="lab-week">${wdOrder}</div>
    </div>${goalEditing ? goalBlock : ''}`;
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
        <div class="history-date">${esc(fmtDate(r.date))} · ${esc(DAY_LABELS[r.day] || r.day)}</div>
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
  content.innerHTML = `<div class="overview">
    <div class="wtrain-head"><h2>${esc(DAY_LABELS[r.day] || r.day)}</h2><button data-act="histBack">← Zurück</button></div>
    <div class="ov-card">
      <div class="ov-card-title">${esc(fmtDate(r.date))}</div>
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
        <div class="history-meta">${ex.setsDone}/${ex.setsTotal} Sätze${ex.weights && ex.weights.some(w => w != null) ? ' · ' + ex.weights.filter(w => w != null).map(w => w + ((UNITS[ex.unit || 'kg'] || UNITS.kg)[1] ? ' ' + (UNITS[ex.unit || 'kg'] || UNITS.kg)[1] : '')).join(', ') : ''}</div>
      </div>`).join('')}
    </div>
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
  { key: 'back', grp: 'musc', name: 'Nur Rücken', ex: ['Bent Over Barbell Row', 'Wide-Grip Lat Pulldown', 'Pullups', 'Straight-Arm Pulldown', 'Barbell Shrug'] },
  { key: 'chest', grp: 'musc', name: 'Nur Brust', ex: ['Barbell Bench Press - Medium Grip', 'Incline Dumbbell Press', 'Dumbbell Flyes', 'Decline Barbell Bench Press', 'Push-Up Wide'] },
  { key: 'shoulders', grp: 'musc', name: 'Schultern', ex: ['Side Lateral Raise', 'Face Pull', 'Dumbbell Shrug', 'Arnold Dumbbell Press', 'Dumbbell Lying Rear Lateral Raise'] },
  { key: 'triceps', grp: 'musc', name: 'Nur Trizeps', ex: ['Triceps Pushdown', 'EZ-Bar Skullcrusher', 'Triceps Pushdown - Rope Attachment', 'Bench Dips', 'Close-Grip Barbell Bench Press'] },
  { key: 'biceps', grp: 'musc', name: 'Nur Bizeps', ex: ['Barbell Curl', 'Alternate Hammer Curl', 'Cable Preacher Curl', 'Alternate Incline Dumbbell Curl'] },
  { key: 'core', grp: 'core', name: 'Core', ex: ['Cable Crunch', 'Hanging Leg Raise', 'Plank', 'Crunches'] },
];
function presetExercises(p) {
  return p.ex.map(n => pool.find(e => e.name === n)).filter(Boolean)
    .map(e => ({ name: e.name, muscle: e.muscle, gif: e.gif, sets: 3, note: '', unit: 'kg' }));
}

function renderStart() {
  const DB = '<svg class="lab-db" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/></svg>';
  const img = ex => `<img src="${esc(ex.gif)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`;
  const muscles = exs => [...new Set(exs.map(e => MUSCLE_DE[e.muscle] || e.muscle))].slice(0, 3).join(' · ');
  const pack = t => `<div class="st-wrap"><button class="st-del" data-act="stDelete" data-id="${t.id}" aria-label="Training löschen">🗑</button><button class="st-pack${t.presetKey ? '' : ' st-own'}" data-act="stStart" data-id="${t.id}">
      <div class="st-pack-th">${t.exercises.slice(0, 4).map(img).join('')}</div>
      <div class="st-pack-body">
        <div class="st-pack-top"><span class="st-pack-name">${esc(t.name)}</span><span class="st-pack-go">ÖFFNEN ›</span></div>
        <div class="st-pack-meta"><span class="st-tag${t.presetKey ? ' pre' : ''}">${t.presetKey ? 'VORLAGE' : '★ EIGEN'}</span> ${t.exercises.length} Übung${t.exercises.length === 1 ? '' : 'en'} · ${esc(muscles(t.exercises))}</div>
        <ol class="st-pack-list">${t.exercises.slice(0, 4).map(e => `<li>${esc(e.name)}</li>`).join('')}${t.exercises.length > 4 ? `<li class="more">+ ${t.exercises.length - 4} weitere</li>` : ''}</ol>
      </div></button></div>`;
  const mini = p => { const exs = presetExercises(p); return `<button class="st-mini" data-act="stPreset" data-key="${p.key}">
      <span class="st-mini-th">${exs[0] ? img(exs[0]) : DB}</span>
      <span class="st-mini-t"><b>${esc(p.name)}</b><em>${exs.length} Üb.</em></span></button>`; };
  const own = weekplan.filter(w => w.exercises.length).sort((a, b) => (a.presetKey ? 1 : 0) - (b.presetKey ? 1 : 0));
  const ownIds = new Set(own.map(w => w.presetKey).filter(Boolean));
  content.innerHTML = `<div class="st">
    <div class="wp-sec">MEINE TRAININGSPAKETE</div>
    <div class="st-packs">${own.map(pack).join('') || '<p class="placeholder">Noch keins – starte unten eine Vorlage oder erstelle ein eigenes.</p>'}</div>
    ${own.length ? '' : '<div class="hh"><div class="hh-top"><b>TIPP</b></div><p>Neu hier? Tippe auf „Eigenes Training erstellen“ – der Trainingshelper führt dich Schritt für Schritt.</p></div>'}
    <button class="st-newbtn" data-act="wNewTraining">+ Eigenes Training erstellen</button>
    <div class="wp-sec">VORLAGEN</div>
    ${[['split', 'Split'], ['musc', 'Einzelne Muskeln'], ['core', 'Core & Bauch']].map(([g, l]) => {
      const ps = PRESETS.filter(p => p.grp === g && !ownIds.has(p.key));
      return ps.length ? `<div class="st-grp">${l}</div><div class="st-minis">${ps.map(mini).join('')}</div>` : '';
    }).join('')}
  </div>`;
}

// Training beenden (Wochenplan-Ansicht und Player): Verlaufseintrag, Sync, Fortschritt zurücksetzen. Auch unvollständig erlaubt.
function finishTraining(t) {
  const wp = wProgRaw(), dOf = wp.done[t.id] || {};
  const exercises = t.exercises.map(ex => {
    const sets = dOf[ex.name] || [];
    return { name: ex.name, muscle: ex.muscle, setsDone: sets.filter(s => s && s.done).length, setsTotal: ex.sets || 3,
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
let playTid = null, playIdx = 0, restEnd = 0, summaryRec = null;
const REST_SEC = 90;
function lastWeights(name) {
  const r = loadHistory().find(h => (h.exercises || []).some(e => e.name === name && (e.weights || []).some(w => w != null)));
  const e = r && r.exercises.find(x => x.name === name);
  return e ? e.weights.filter(w => w != null) : [];
}
function playStart(id) {
  const t = trainingById(id); if (!t) return;
  const dOf = wProgRaw().done[t.id] || {};
  const firstOpen = t.exercises.findIndex(ex => ((dOf[ex.name] || []).filter(x => x && x.done).length) < (ex.sets || 3));
  playTid = id; playIdx = firstOpen < 0 ? 0 : firstOpen; restEnd = 0; pushStart(id); view = 'play';
}
function renderPlay() {
  const t = trainingById(playTid);
  if (!t || !t.exercises.length) { view = 'start'; return renderStart(); }
  playIdx = Math.max(0, Math.min(playIdx, t.exercises.length - 1));
  const ex = t.exercises[playIdx], dOf = wProgRaw().done[t.id] || {}, sets = dOf[ex.name] || [];
  const n = ex.sets || 3, unit = ex.unit || 'kg', last = lastWeights(ex.name);
  const doneN = e => ((dOf[e.name] || []).filter(x => x && x.done).length);
  const isLast = playIdx === t.exercises.length - 1;
  const totalDone = t.exercises.reduce((a, e) => a + doneN(e), 0), totalAll = t.exercises.reduce((a, e) => a + (e.sets || 3), 0);
  content.innerHTML = `<div class="pl">
    <div class="pl-top">
      <button class="pl-x" data-act="playExit" aria-label="Zurück">✕</button>
      <div class="pl-title"><b>${esc(t.name)}</b><span>Übung ${playIdx + 1} / ${t.exercises.length} · ${totalDone}/${totalAll} Sätze</span></div>
      <button class="pl-x pl-del" data-act="playDelete" aria-label="Training löschen">🗑</button>
    </div>
    <div class="pl-dots">${t.exercises.map((e, i) => `<button class="${i === playIdx ? 'cur' : ''}${doneN(e) >= (e.sets || 3) ? ' ok' : doneN(e) ? ' part' : ''}" data-act="playGo" data-i="${i}" aria-label="Übung ${i + 1}"></button>`).join('')}</div>
    <div class="pl-media"><img src="${esc(ex.gif)}" alt="" onerror="this.style.visibility='hidden'"></div>
    <div class="pl-name">${esc(ex.name)}</div>
    <div class="pl-muscle">${esc(MUSCLE_DE[ex.muscle] || ex.muscle)}${last.length ? ` · letztes Mal ${last.join(' / ')} ${UNITS[unit][1]}` : ''}</div>
    <div class="pl-sets">${Array.from({ length: n }, (_, k) => {
      const s = sets[k] || {}, pl = (ex.plan || [])[k] || {}, ph = pl.w ?? last[k] ?? last[last.length - 1];
      return `<div class="pl-set${s.done ? ' done' : ''}">
        <span class="pl-k">${k + 1}${pl.r != null ? `<small>${pl.r} ${unit === 'sek' ? 's' : '×'}</small>` : ''}</span>
        ${unit === 'none' ? '<span class="pl-free">Satz</span>' : `<input type="number" inputmode="decimal" data-act="wWeight" data-id="${t.id}" data-i="${playIdx}" data-k="${k}" value="${s.weight ?? ''}" placeholder="${ph ?? UNITS[unit][0]}"><span class="pl-u">${UNITS[unit][1] || ''}</span>`}
        <button class="pl-ok" data-act="playSet" data-k="${k}" aria-label="Satz ${k + 1} fertig">${s.done ? '✓' : ''}</button>
      </div>`; }).join('')}
      <button class="pl-addset" data-act="playEdit">⚙ Sätze ändern</button>
    </div>
    <div class="pl-rest${restEnd > Date.now() ? '' : ' off'}" id="rest"><span>PAUSE</span><b id="rest-t">0:00</b><button data-act="restAdd">+15 s</button><button data-act="restSkip">Skip</button></div>
    <div class="pl-nav">
      <button class="pl-prev" data-act="playPrev"${playIdx === 0 ? ' disabled' : ''}>‹</button>
      ${isLast ? `<button class="pl-next pl-fin" data-act="playFinish">${totalDone >= totalAll ? 'Training beenden' : 'Beenden (unvollständig)'}</button>` : `<button class="pl-next" data-act="playNext">Weiter ›</button>`}
    </div>
  </div>`;
  tickRest();
}
function tickRest() {
  const box = document.getElementById('rest'); if (!box) return;
  const left = Math.ceil((restEnd - Date.now()) / 1000);
  if (restEnd && left <= 0) { restEnd = 0; try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {} }
  box.classList.toggle('off', !restEnd);
  const el = document.getElementById('rest-t'); if (el && left > 0) el.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
}
setInterval(tickRest, 500);
function renderSummary() {
  const r = summaryRec;
  if (!r) { view = 'overview'; return renderOverview(); }
  const full = r.totalSetsDone >= r.totalSetsPlanned;
  content.innerHTML = `<div class="pl sm">
    <div class="sm-badge${full ? '' : ' part'}">${full ? '✓' : '◐'}</div>
    <div class="sm-title">${full ? 'Training geschafft' : 'Fertig – unvollständig'}</div>
    <div class="sm-sub">${esc(r.day)}</div>
    <div class="pf-stats"><div><b>${r.durationMin ?? '–'}</b><span>Minuten</span></div><div><b>${r.totalSetsDone}/${r.totalSetsPlanned}</b><span>Sätze</span></div><div><b>${r.calories ?? '–'}</b><span>kcal</span></div></div>
    <div class="ov-card">${r.exercises.map(e => `<div class="pf-row"><span>${esc(e.name)}</span><b>${e.setsDone}/${e.setsTotal}</b></div>`).join('')}</div>
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
      <div class="pl-title"><b>${esc(t.name)}</b><span>${t.exercises.length} Übungen · ${sets} Sätze</span></div>
      ${p ? '' : `<button class="pl-x pl-del" data-act="prevDelete" aria-label="Training löschen">🗑</button>`}</div>
    <div class="pv-list">${t.exercises.map((e, i) => `<div class="pv-ex"><span class="pv-n">${i + 1}</span>
      <img src="${esc(e.gif)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
      <div><b>${esc(e.name)}</b><em>${esc(MUSCLE_DE[e.muscle] || e.muscle)} · ${e.sets || 3} Sätze</em></div></div>`).join('')}</div>
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
  const meta = t => `${t.exercises.length} Übung${t.exercises.length === 1 ? '' : 'en'} · ${t.weekdays.length ? WD_KEYS.filter(k => t.weekdays.includes(k)).map(k => WD_LABELS[k]).join(' ') + (t.time ? ' · ' + esc(t.time) : '') : 'nicht eingeplant'}`;
  const dayTiles = WD_KEYS.map((k, i) => {
    const ds = addDays(ws, i);
    const items = weekplan.map(w => ({ w, status: trainingStatusForDate(w, ds) })).filter(x => x.status);
    const worst = ['verpasst', 'unvollständig', 'offen', 'geplant', 'vorher', 'erledigt'].find(st => items.some(x => x.status === st)) || null;
    const n = items.reduce((sum, x) => sum + x.w.exercises.length, 0);
    const target = (items.find(x => x.status !== 'erledigt') || items[0] || {}).w;
    const act = target ? `data-act="wOpen2" data-id="${target.id}"` : `data-act="wDayNew" data-wd="${k}" data-date="${ds}"`;
    return `<div class="wp-cell"><button class="wp-day${worst ? ' wp-' + worst : ' wp-aus'}${worst && worst !== 'verpasst' ? (n ? ' wp-ex' : ' wp-leer') : ''}${ds === t0 ? ' wp-heute' : ''}" ${act}><b>${WD_LABELS[k]}</b>${worst ? DB : '<em>+</em>'}<span>${worst ? (n ? n + ' Üb.' : 'leer') : 'Ruhe'}</span></button>${target ? `<button class="wp-x" data-act="wUnsched" data-id="${target.id}" data-wd="${k}" aria-label="Aus Plan entfernen">×</button>` : ''}</div>`;
  }).join('');
  const customCards = custom.map(t => {
    const th = t.exercises.slice(0, 3).map(ex => `<img src="${esc(ex.gif)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`).join('');
    const st = trainingStatusForDate(t, t0);
    return `<div class="wp-card" data-act="wOpen2" data-id="${t.id}">
      <div class="wp-thumbs">${th || DB}</div>
      <div class="wp-card-body"><div class="wp-card-name">${esc(t.name)}</div><div class="wp-card-meta">${meta(t)}${st ? ' · ' + STATUS_LABEL[st] : ''}</div></div>
      <span class="wp-chev">›</span>
    </div>`;
  }).join('');
  content.innerHTML = `
    <div class="wp">
      <div class="wp-sec">DIESE WOCHE</div>
      <div class="wp-days">${dayTiles}</div>
      <div class="wp-sec">TRAININGS</div>
      ${customCards || '<p class="placeholder">Noch keine eigenen Trainings – z. B. „Ganzkörper“ oder „Mobility“.</p>'}
      ${addingTraining ? hint('name', 1, 'Gib deinem Training einen Namen, zum Beispiel „Oberkörper“ oder „Montag“. Danach geht es mit den Übungen weiter.') : ''}
      ${addingTraining
        ? `<div class="wp-card wp-new"><input id="new-training-name" placeholder="Name des Trainings…" autofocus>
             <div class="edit-bar"><button data-act="wNewTrainingSave">Speichern</button><button data-act="wNewTrainingCancel">Abbrechen</button></div></div>`
        : `<button class="wp-add" data-act="wNewTraining">+ Neues Training</button>`}
    </div>`;
  if (addingTraining) document.getElementById('new-training-name')?.focus();
}

// V2-09: Trainings-Detail – Übungen mit Video(GIF)/Erklärung, editierbare Sätze + Gewicht, Notizen.
function newDraft() {
  const t = { id: 'w' + Date.now(), name: '', draft: true, exercises: [], weekdays: [], since: {}, time: '' };
  weekplan.push(t); wId = t.id; renameId = t.id; view = 'wtrain'; picker = null;
}
const wOpen = new Set(); // UI-Zustand: 'tid:i' = Einstellungen offen, 'tid:i:s' = Sätze einzeln
function exCard(t, ex, i) {
  const key = t.id + ':' + i, u = ex.unit || 'kg', n = ex.sets || 3, plan = ex.plan || [];
  const at = (k, f) => (plan[k] || {})[f] ?? null;
  const uniform = Array.from({ length: n }, (_, k) => k).every(k => at(k, 'w') === at(0, 'w') && at(k, 'r') === at(0, 'r'));
  const split = u !== 'none' && (wOpen.has(key + ':s') || !uniform);
  const open = wOpen.has(key);
  const rl = u === 'sek' ? 'Sek' : 'Wdh';
  const da = `data-id="${t.id}" data-i="${i}"`;
  const fld = (act, f, k, val) => `<label class="xc-f"><input type="number" inputmode="${f === 'w' ? 'decimal' : 'numeric'}" value="${val ?? ''}" placeholder="–" data-act="${act}" ${da}${k === null ? '' : ` data-k="${k}"`} data-f="${f}" aria-label="${f === 'w' ? 'kg' : rl}"><span>${f === 'w' ? 'kg' : rl}</span></label>`;
  let rowB = `<div class="xc-step"><button data-act="wSetsAdj" ${da} data-d="-1" aria-label="Ein Satz weniger">–</button><b>${n}</b><button data-act="wSetsAdj" ${da} data-d="1" aria-label="Ein Satz mehr">+</button></div>`;
  if (u === 'none') rowB += `<span class="xc-hint">nur abhaken</span>`;
  else if (split) rowB += `<button class="xc-same" data-act="wSame" ${da}>Alle gleich</button>`;
  else rowB += `<span class="xc-x">×</span>${u === 'kg' ? fld('wPlanAll', 'w', null, at(0, 'w')) : ''}${fld('wPlanAll', 'r', null, at(0, 'r'))}`;
  const pills = split ? `<div class="xc-pills">${Array.from({ length: n }, (_, k) => `<div class="xc-pill"><b>${k + 1}</b>${u === 'kg' ? fld('wPlan', 'w', k, at(k, 'w')) : ''}${fld('wPlan', 'r', k, at(k, 'r'))}</div>`).join('')}</div>` : '';
  const more = open ? `<div class="xc-more"><div class="xc-seg">${Object.entries({ kg: 'Gewicht', wdh: 'Wdh', sek: 'Sek', none: 'Haken' }).map(([v, l]) => `<button class="${u === v ? 'on' : ''}" data-act="wUnitSet" ${da} data-u="${v}">${l}</button>`).join('')}</div>${u !== 'none' && !split ? `<button class="xc-link" data-act="wSplit" ${da}>Sätze einzeln eintragen</button>` : ''}<textarea class="w-note" placeholder="Notiz zur Übung…" data-act="wExNote" ${da}>${esc(ex.note || '')}</textarea></div>` : '';
  return `<div class="ts-set xc"><div class="xc-top"><span class="xc-n">${esc(ex.name)}</span><button class="xc-gear${open ? ' on' : ''}${ex.note ? ' has' : ''}" data-act="wMore" ${da} aria-label="Einstellungen" aria-expanded="${open}">⋯</button></div><div class="xc-row">${rowB}</div>${pills}${more}</div>`;
}
function renderWTrain() {
  const t = trainingById(wId);
  if (!t) { view = 'overview'; return renderOverview(); }
  const step = helperStep(t);
  const started = startOf(t.id, today());
  const hasEx = t.exercises.length > 0, hasDays = t.weekdays && t.weekdays.length > 0;
  const sec = (n, title, ok, body) => `<section class="ts${step === n ? ' now' : ''}${ok ? ' ok' : ''}"><div class="ts-h"><span class="ts-n">${ok ? '✓' : n}</span><b>${title}</b></div>${body}</section>`;
  const ws = mondayOf(today()), miss = Array.from({ length: 7 }, (_, i) => addDays(ws, i)).filter(ds => trainingStatusForDate(t, ds) === 'verpasst');
  content.innerHTML = `<div class="tsx">
    ${sec(1, 'Name', !t.draft, renameId === t.id
      ? `${t.draft ? hint('name', 1, 'Gib deinem Training einen Namen, zum Beispiel „Oberkörper“ oder „Montag“. Danach geht es mit den Übungen weiter.') : ''}<input id="rename-input" placeholder="Name des Trainings…" value="${esc(t.name)}"><div class="edit-bar"><button data-act="wRenameSave" data-id="${t.id}">Speichern</button><button data-act="wRenameCancel" data-id="${t.id}">Abbrechen</button></div>`
      : `<div class="ts-name"><h2>${esc(t.name)}</h2><div class="ts-name-btns"><button data-act="wRename" data-id="${t.id}">Umbenennen</button><button class="ts-name-del" data-act="wDelete" data-id="${t.id}">Löschen</button></div></div>`)}
    ${sec(2, 'Übungen', hasEx, `${step === 2 ? hint('ex', 2, 'Hier fügst du Übungen hinzu: auf „+ Übung hinzufügen“ tippen, suchen und antippen. Du kannst mehrere nacheinander wählen.') : ''}
      ${t.exercises.map((ex, i) => `<div class="ts-ex"><img src="${esc(ex.gif)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><div><b>${esc(ex.name)}</b><em>${esc(MUSCLE_DE[ex.muscle] || ex.muscle)}</em></div><button data-act="wRemoveEx" data-id="${t.id}" data-i="${i}" aria-label="Übung entfernen">✕</button></div>`).join('')}
      <button class="ts-add" data-act="wAddEx" data-id="${t.id}">+ Übung hinzufügen</button>`)}
    ${hasEx ? sec(3, 'Sätze &amp; Eintragen', step > 3, `${step === 3 ? hint('sets', 3, 'Pro Übung: Sätze, kg und Wiederholungen eintragen (gilt für alle Sätze). Über ⋯ stellst du Einheit, einzelne Sätze und Notiz ein. Felder dürfen leer bleiben.') : ''}
      ${t.exercises.map((ex, i) => exCard(t, ex, i)).join('')}`) : ''}
    ${hasEx ? sec(4, 'Tage &amp; Uhrzeit', hasDays, `${step === 4 ? hint('days', 4, 'Hier legst du fest, an welchen Tagen du dieses Training machst. Tippe einfach die Wochentage an.') : ''}
      <div class="w-schedule"><div class="w-schedule-days">${WD_KEYS.map(k => `<button class="chip${t.weekdays.includes(k) ? ' active' : ''}" data-act="wDayToggle" data-id="${t.id}" data-wd="${k}">${WD_LABELS[k]}</button>`).join('')}</div>
        <input type="time" class="w-schedule-time" data-act="wTime" data-id="${t.id}" value="${esc(t.time || '')}" title="Uhrzeit (informativ, kein Cutoff)"></div>
      ${miss.length ? `<div class="w-missed">${miss.map(ds => `<span>${WD_LABELS[wdKeyOf(ds)]} verpasst</span><button data-act="wSkip" data-id="${t.id}" data-date="${ds}">Als Ruhetag werten</button>`).join('')}</div>` : ''}`) : ''}
    ${hasEx ? sec(5, 'Los geht’s', false, `${step === 5 ? hint('go', 5, 'Fertig eingerichtet! Tippe auf „Training starten“, wenn du loslegen willst. Alles lässt sich jederzeit ändern.') : ''}
      <button class="ts-save" data-act="wSavePack">✓ SPEICHERN &amp; ZUR SCHNELLAUSWAHL</button>
      <button class="pl-next ts-go" data-act="${started ? 'quickStart' : 'wStart'}" data-id="${t.id}">${started ? '▶ WORKOUT FORTSETZEN' : '▶ TRAINING STARTEN'}</button>`) : ''}
    <button class="ts-del" data-act="wDelete" data-id="${t.id}">Training löschen</button>
  </div>`;
  if (renameId === t.id) document.getElementById('rename-input')?.focus();
}

// V7-01: Profil-Seite – Basis für Kalorienberechnung (V8-03), keine Herzfrequenz nötig.
function renderProfile() {
  const p = loadProfile();
  const h = loadHistory();
  const goal = loadGoal();
  const streak = computeStreak(h);
  const sets = h.reduce((n, r) => n + (r.totalSetsDone || 0), 0);
  const first = h.length ? h.reduce((m, r) => r.date < m ? r.date : m, h[0].date) : null;
  const since = first ? new Date(first + 'T12:00:00').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) : null;
  const ini = (p.name || '').trim().charAt(0).toUpperCase();
  const bad = document.body.classList.contains('mood-bad');
  content.innerHTML = `
    <div class="overview pf">
      <div class="pf-hero">
        <div class="pf-avatar">${ini ? esc(ini) : '◉'}</div>
        <div class="pf-who">
          <input class="pf-name" placeholder="Dein Name" maxlength="24" data-act="profileField" data-field="name" value="${esc(p.name || '')}">
          <div class="pf-sub">${since ? 'Dabei seit ' + since : 'Noch kein Training – los geht’s'}</div>
        </div>
      </div>
      <div class="pf-stats">
        <div><b>${h.length}</b><span>Trainings</span></div>
        <div><b>${streak}</b><span>Streak</span></div>
        <div><b>${sets}</b><span>Sätze</span></div>
      </div>
      <div class="ov-card">
        <div class="ov-card-title">Körper</div>
        <label class="pf-row">Gewicht<span><input type="number" inputmode="decimal" data-act="profileField" data-field="weight" value="${p.weight ?? ''}" placeholder="–"> kg</span></label>
        <p class="placeholder">Grundlage für die Kalorien-Schätzung pro Training.</p>
      </div>
      <div class="ov-card">
        <div class="ov-card-title">Ziel</div>
        <div class="pf-row">${goal.target} Trainings in ${goal.periodDays === 7 ? '1 Woche' : goal.periodDays + ' Tagen'}<button class="ov-btn ov-btn-ghost" data-act="goalEditFromProfile">Anpassen</button></div>
      </div>
      <div class="ov-card">
        <div class="ov-card-title">Trainingshelper</div>
        <div class="pf-row">Hinweise wieder anzeigen<button class="ov-btn ov-btn-ghost" data-act="helperReset">Zurücksetzen</button></div>
      </div>
      <div class="ov-card">
        <div class="ov-card-title">Backup</div>
        <p class="placeholder">Pläne, Verlauf und Ziel als Text sichern oder wiederherstellen.</p>
        <textarea id="backup-text" class="w-note" placeholder="Hier steht dein Backup oder füge eins ein…"></textarea>
        <div class="edit-bar"><button class="ov-btn" data-act="backupExport">Backup erzeugen &amp; kopieren</button><button class="ov-btn ov-btn-ghost" data-act="backupImport">Aus Text wiederherstellen</button></div>
      </div>
    </div>`;
}

// V3: Mobile/Content-Seite für "Alle Übungen" – Push/Pull/Legs/Core zum Antippen
// (auf Desktop-Breite steht die Sidebar-Version daneben, hier der Direktzugriff für iPhone).
let browsePage = 0, browsePer = 9;
const BTILE = 128; // feste Kachelhöhe in der Galerie (px)
let browseQ = '', browseSel = null, filterOpen = false; // "Alle Übungen": Suchtext, gewählte Übung (Detail-Sheet), Filter-Sheet offen
function renderAllEx() {
  const ex = browseSel != null ? pool[browseSel] : null;
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
  const sheet = ex ? `<div class="goal-sheet"><div class="goal-edit browse-sheet">
      <img class="browse-gif" src="${esc(ex.gif)}" alt="" onerror="this.style.visibility='hidden'">
      <div class="exercise-name">${esc(ex.name)}</div>
      <div class="exercise-muscle">${esc(ex.muscle)}${MUSCLE_GROUPS[ex.muscle] ? ' · ' + MUSCLE_GROUPS[ex.muscle] : ''}</div>
      <div class="ov-card-title">Zu Training hinzufügen</div>
      <div class="browse-trainings">${weekplan.map(t => { const has = t.exercises.some(e => e.name === ex.name);
        return `<button class="ov-btn ov-btn-ghost${has ? ' browse-has' : ''}" data-act="browseAdd" data-id="${t.id}">${esc(t.name)}${has ? ' ✓' : ''}</button>`; }).join('')}</div>
      <button class="ov-btn" data-act="browseClose">Schließen</button>
    </div></div>` : '';
  content.innerHTML = `<div class="picker allex">
      <div class="picker-head"><input id="q" type="search" placeholder="${pool.length} Übungen durchsuchen…" value="${esc(browseQ)}" autocomplete="off">
        <button class="allex-filter${nF ? ' on' : ''}" data-act="fOpen">Filter${nF ? ' · ' + nF : ''}</button></div>
      ${nF ? `<div class="filter-chips">${active.map(([a, v, l]) => `<button class="chip active" data-act="${a}" data-v="${v}">${l} ✕</button>`).join('')}</div>` : ''}
      <div id="results" class="results"></div>
      <div class="allex-pager"><button data-act="bPrev" aria-label="Zurück">‹</button><span id="pager-info">…</span><button data-act="bNext" aria-label="Weiter">›</button></div>
    </div>${filterSheet}${sheet}`;
  const q = document.getElementById('q');
  q.addEventListener('input', () => { browseQ = q.value; browsePage = 0; renderResults(q.value); });
  const res = document.getElementById('results');
  const rows = Math.max(1, Math.floor((res.clientHeight + 8) / (BTILE + 8)));
  browsePer = rows * 3;
  res.style.gridAutoRows = ((res.clientHeight - (rows - 1) * 8) / rows) + 'px'; // Kacheln füllen die Fläche exakt aus
  renderResults(browseQ);
  let x0 = null;
  res.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  res.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 60) { browsePage += dx < 0 ? 1 : -1; render(); } });
}

// V2-03/V4: TV-Modus – eine Übung groß, für Screen-Mirroring/AirPlay auf Apple TV. Nutzt den
// zuletzt aktiven Trainingstag. V4: Einstieg jetzt über das TV-Icon oben rechts (von überall
// im Training aus erreichbar), "Zurück" führt sauber zur vorherigen Ansicht zurück.
function renderTV() {
  const backBtn = `<button data-act="tvBack">← Zurück</button>`;
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
  content.innerHTML = `
    <div class="tv">
      <div class="tv-count">${tvIndex + 1} / ${items.length} · ${esc(title)}</div>
      <img class="tv-gif" src="${esc(ex.gif)}" alt="" onerror="this.style.visibility='hidden'">
      <div class="tv-name">${esc(ex.name)}</div>
      <div class="tv-muscle">${esc(ex.muscle)}</div>
      <div class="tv-sets">${Array.from({ length: n }, (_, k) =>
        `<button class="set${isDone(k) ? ' done' : ''}" data-act="${wt ? 'tvWSet' : 'set'}" data-i="${tvIndex}" data-k="${k}">Satz ${k + 1}${isDone(k) ? ' ✓' : ''}</button>`).join('')}</div>
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
  const btn = e.target.closest('button[data-act], .weeklist-card[data-act], .wp-card[data-act], .history-item[data-act]');
  if (!btn) return;
  const i = Number(btn.dataset.i);
  const arr = list().slice();
  if (btn.dataset.act === 'fMuscle') {
    filterMuscle = (filterMuscle === btn.dataset.v) ? null : btn.dataset.v;
    document.querySelectorAll('[data-act="fMuscle"]').forEach(b => b.classList.toggle('active', b.dataset.v === filterMuscle));
    if (view === 'allex') { browsePage = 0; render(); } else renderResults(document.getElementById('q').value);
    return;
  }
  if (btn.dataset.act === 'fEquip') {
    filterEquip = (filterEquip === btn.dataset.v) ? null : btn.dataset.v;
    document.querySelectorAll('[data-act="fEquip"]').forEach(b => b.classList.toggle('active', b.dataset.v === filterEquip));
    if (view === 'allex') { browsePage = 0; render(); } else renderResults(document.getElementById('q').value);
    return;
  }
  if (btn.dataset.act === 'fMus') {
    filterMus = (filterMus === btn.dataset.v) ? null : btn.dataset.v;
    browsePage = 0; render(); return;
  }
  if (btn.dataset.act === 'fReset') { filterMuscle = filterEquip = filterCat = filterMus = null; browsePage = 0; render(); return; }
  if (btn.dataset.act === 'fOpen') { filterOpen = true; render(); return; }
  if (btn.dataset.act === 'fClose') { filterOpen = false; render(); return; }
  if (btn.dataset.act === 'fCat') {
    filterCat = (filterCat === btn.dataset.v) ? null : btn.dataset.v;
    document.querySelectorAll('[data-act="fCat"]').forEach(b => b.classList.toggle('active', b.dataset.v === filterCat));
    if (view === 'allex') { browsePage = 0; render(); } else renderResults(document.getElementById('q').value);
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
    case 'stStart': prevId = btn.dataset.id; prevKey = null; view = 'preview'; break;
    case 'stPreset': prevKey = btn.dataset.key; prevId = null; view = 'preview'; break;
    case 'prevBack': view = 'start'; break;
    case 'prevGo': {
      if (prevKey) {
        const p = PRESETS.find(x => x.key === prevKey);
        let t = weekplan.find(w => w.presetKey === p.key);
        if (!t) { t = { id: 'w' + Date.now(), name: p.name, presetKey: p.key, exercises: presetExercises(p), weekdays: [], since: {}, time: '' }; weekplan.push(t); saveWeekplan(); }
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
    case 'playExit': view = 'overview'; break;
    case 'playGo': playIdx = Number(btn.dataset.i); break;
    case 'playNext': playIdx++; break;
    case 'playPrev': playIdx--; break;
    case 'playEdit': wId = playTid; view = 'wtrain'; break;
    case 'playAddSet': { const ex = trainingById(playTid).exercises[playIdx]; ex.sets = Math.min(10, (ex.sets || 3) + 1); saveWeekplan(); break; }
    case 'playSet': {
      const t = trainingById(playTid), ex = t.exercises[playIdx], k = Number(btn.dataset.k);
      const wp = wProgRaw(), d = wp.done[t.id] = wp.done[t.id] || {}, sets = d[ex.name] = d[ex.name] || [];
      sets[k] = sets[k] || {};
      sets[k].done = !sets[k].done;
      if (sets[k].done) {
        if (sets[k].weight == null && (ex.unit || 'kg') !== 'none') { const l = lastWeights(ex.name), pl = (ex.plan || [])[k] || {}; const pre = pl.w ?? l[k] ?? l[l.length - 1]; if (pre != null) sets[k].weight = pre; }
        restEnd = Date.now() + REST_SEC * 1000; pushStart(t.id);
      } else restEnd = 0;
      saveWProg(wp); break;
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
    case 'wOpen2': wId = btn.dataset.id; view = 'wtrain'; break;
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
      const t = { id: 'w' + Date.now(), name: nm, exercises: [], weekdays: btn.dataset.date >= today() ? [wd] : [], since: btn.dataset.date >= today() ? { [wd]: today() } : {}, time: '' }; // vergangene Tage nicht einplanen (sonst sofort "verpasst")
      weekplan.push(t); saveWeekplan();
      wId = t.id; view = 'wtrain'; picker = null; break;
    }
    case 'wNewTraining': newDraft(); break;
    case 'wNewTrainingCancel': addingTraining = false; break;
    case 'wNewTrainingSave': {
      const name = (document.getElementById('new-training-name')?.value || '').trim();
      if (!name) return;
      const t = { id: 'w' + Date.now(), name, exercises: [], weekdays: [], since: {}, time: '' };
      weekplan.push(t); saveWeekplan();
      addingTraining = false; wId = t.id; view = 'wtrain'; break;
    }
    case 'wRename': renameId = btn.dataset.id; break;
    case 'wRenameCancel': { const d = trainingById(btn.dataset.id); if (d && d.draft) { weekplan = weekplan.filter(x => x !== d); view = 'weeklist'; } renameId = null; break; }
    case 'wRenameSave': {
      const name = (document.getElementById('rename-input')?.value || '').trim();
      if (!name) return;
      { const tt = trainingById(btn.dataset.id); tt.name = name; delete tt.draft; } saveWeekplan();
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
    case 'playFinish': { const rec = finishTraining(trainingById(playTid)); if (!rec) return; summaryRec = rec; restEnd = 0; view = 'summary'; break; }
    case 'wDayToggle': {
      const t = trainingById(btn.dataset.id), wd = btn.dataset.wd;
      const idx = t.weekdays.indexOf(wd);
      if (idx === -1) { t.weekdays.push(wd); (t.since = t.since || {})[wd] = today(); } else t.weekdays.splice(idx, 1);
      saveWeekplan(); break;
    }
    case 'wUnsched': { const t = trainingById(btn.dataset.id); t.weekdays = t.weekdays.filter(x => x !== btn.dataset.wd); saveWeekplan(); break; }
    case 'bPrev': browsePage--; break;
    case 'bNext': browsePage++; break;
    case 'browsePick': browseSel = Number(btn.dataset.p); break;
    case 'browseClose': browseSel = null; break;
    case 'browseAdd': {
      const t = trainingById(btn.dataset.id), ex = pool[browseSel];
      if (t && ex && !t.exercises.some(e => e.name === ex.name)) { t.exercises.push({ name: ex.name, muscle: ex.muscle, gif: ex.gif, sets: 3, note: '' }); saveWeekplan(); }
      break;
    }
    case 'wSavePack': saveWeekplan(); view = 'start'; break;
    case 'wStart': playStart(btn.dataset.id); break;
    case 'wSkip': { const t = trainingById(btn.dataset.id); (t.skipped = t.skipped || []).push(btn.dataset.date); saveWeekplan(); break; }
    case 'wDelete': {
      const t = trainingById(btn.dataset.id);
      if (!confirm(`Training „${t.name}“ löschen? (Verlauf bleibt erhalten)`)) return;
      weekplan = weekplan.filter(w => w.id !== t.id); saveWeekplan(); wId = null; view = 'weeklist'; break;
    }
    case 'histDelete': {
      if (!confirm('Verlaufseintrag löschen?')) return;
      const h = loadHistory(); h.splice(histDetailIdx, 1);
      try { localStorage.setItem(HKEY, JSON.stringify(h)); } catch (e2) {}
      view = 'history'; break;
    }
    case 'backupExport': {
      const o = {}; for (let n = 0; n < localStorage.length; n++) { const k = localStorage.key(n); if (k && k.startsWith('heimtraining.')) o[k] = localStorage.getItem(k); }
      const txt = JSON.stringify(o); const ta = document.getElementById('backup-text'); ta.value = txt; ta.select();
      try { navigator.clipboard.writeText(txt); } catch (e2) {}
      return;
    }
    case 'backupImport': {
      try {
        const o = JSON.parse(document.getElementById('backup-text').value);
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
