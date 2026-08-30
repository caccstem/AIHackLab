const filters = document.querySelectorAll('[data-filter]');
const works = document.querySelectorAll('.work');
filters.forEach((filter) => filter.addEventListener('click', () => {
  filters.forEach((item) => item.classList.remove('active'));
  filter.classList.add('active');
  works.forEach((work) => work.classList.toggle('hidden', filter.dataset.filter !== 'all' && work.dataset.type !== filter.dataset.filter));
}));

document.querySelectorAll('.film-card').forEach((card) => {
  const video = card.querySelector('video');
  const button = card.querySelector('.play');
  const toggle = () => {
    if (video.paused) { video.play(); button.style.opacity = '0'; }
    else { video.pause(); button.style.opacity = '1'; }
  };
  card.addEventListener('click', toggle);
});

document.querySelector('.newsletter form').addEventListener('submit', (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  button.textContent = '✓';
  event.currentTarget.querySelector('input').value = '';
});
