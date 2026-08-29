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

const isGateway = document.body.classList.contains('gateway-page');
const mobileLinks = isGateway
  ? [
      ['⌂', 'Home', 'index.html'],
      ['◎', 'Connect', 'connect.html'],
      ['文', 'School', 'https://www.caccusa.org'],
      ['＋', 'Join', 'join.html'],
    ]
  : [
      ['⌂', 'Home', 'connect.html'],
      ['▦', 'Programs', 'connect.html#activities'],
      ['◉', 'Events', 'connect.html#events'],
      ['＋', 'Join', 'join.html'],
    ];

const mobileDock = document.createElement('nav');
mobileDock.className = 'mobile-dock';
mobileDock.setAttribute('aria-label', 'Mobile quick navigation');
mobileDock.innerHTML = mobileLinks.map(([icon, label, href]) =>
  `<a href="${href}"><span aria-hidden="true">${icon}</span><small>${label}</small></a>`
).join('');
document.body.append(mobileDock);

const activities = document.querySelector('#activities');
const categories = [...document.querySelectorAll('#activities .category')];
if (activities && categories.length) {
  const shortcuts = document.createElement('nav');
  shortcuts.className = 'category-jumps';
  shortcuts.setAttribute('aria-label', 'Jump to an activity category');
  shortcuts.innerHTML = categories.map((category, index) => {
    const heading = category.querySelector('h3');
    const id = `category-${index + 1}`;
    category.id = id;
    const shortLabel = heading.textContent.replace(' & Recreation', '').replace(' & Heritage', '');
    return `<a href="#${id}">${shortLabel}</a>`;
  }).join('');
  activities.prepend(shortcuts);
}
