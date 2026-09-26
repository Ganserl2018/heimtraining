const tabs = document.querySelectorAll('.tab');
const content = document.getElementById('content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const day = tab.dataset.day;
    content.innerHTML = `<p class="placeholder">Tag: ${day} — Übungen folgen (V1-04).</p>`;
  });
});
