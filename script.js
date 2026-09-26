const tabs = document.querySelectorAll('.tab');
const content = document.getElementById('content');

let exercises = {};

fetch('exercises.json')
  .then(r => r.json())
  .then(data => {
    exercises = data;
    render('push');
  })
  .catch(err => {
    content.innerHTML = `<p class="error">Fehler beim Laden der Übungen: ${err}</p>`;
  });

function render(day) {
  const list = exercises[day] || [];
  if (!list.length) {
    content.innerHTML = `<p class="placeholder">Keine Übungen für ${day}.</p>`;
    return;
  }
  content.innerHTML = list.map(ex => `
    <div class="exercise">
      <img class="exercise-gif" src="${ex.gif}" alt="${ex.name}" loading="lazy">
      <div class="exercise-info">
        <div class="exercise-name">${ex.name}</div>
        <div class="exercise-muscle">${ex.muscle}</div>
      </div>
    </div>
  `).join('');
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    render(tab.dataset.day);
  });
});
