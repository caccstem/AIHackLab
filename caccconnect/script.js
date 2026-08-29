const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('#main-nav');

menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? 'Close' : 'Menu';
});

nav?.addEventListener('click', (event) => {
  if (!event.target.closest('a')) return;
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.textContent = 'Menu';
});

document.querySelectorAll('[data-demo-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const message = form.querySelector('.form-message');
    message?.classList.add('show');
    form.reset();
  });
});
