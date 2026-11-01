const API = '/api/rules';
let rules = [];
const list = document.querySelector('#rule-list');
const dialog = document.querySelector('#rule-dialog');
const form = document.querySelector('#rule-form');
const toast = document.querySelector('#toast');

async function loadRules() {
  try {
    const response = await fetch(API);
    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    rules = data.rules || [];
    document.querySelector('#sync-label').textContent = 'Synced just now';
    document.querySelector('.sync-state i').style.background = '#62a775';
    render();
  } catch {
    document.querySelector('#sync-label').textContent = 'Server disconnected';
    document.querySelector('.sync-state i').style.background = '#d89253';
  }
}

async function saveRules() {
  const response = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rules }) });
  if (!response.ok) throw new Error('Could not save replies');
  rules = (await response.json()).rules;
  render();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function render() {
  const query = document.querySelector('#search').value.trim().toLowerCase();
  const shown = rules.filter(rule => `${rule.question} ${rule.response}`.toLowerCase().includes(query));
  document.querySelector('#metric-total').textContent = rules.length;
  document.querySelector('#metric-active').textContent = rules.filter(rule => rule.enabled).length;
  document.querySelector('#nav-count').textContent = rules.length;
  document.querySelector('#showing-count').textContent = `${shown.length} ${shown.length === 1 ? 'reply' : 'replies'}`;
  document.querySelector('#empty-state').classList.toggle('visible', shown.length === 0);
  list.innerHTML = shown.map(rule => `<div class="rule-row" data-id="${escapeHTML(rule.id)}">
    <div class="rule-copy" data-action="edit"><div class="rule-question">${escapeHTML(rule.question)}</div><div class="rule-response">${escapeHTML(rule.response).replace(/\n/g, ' ')}</div></div>
    <span class="status-pill ${rule.enabled ? '' : 'paused'}">${rule.enabled ? 'Active' : 'Paused'}</span>
    <span class="edited">Recently</span><button class="row-menu" aria-label="Reply actions" data-action="menu">···</button>
  </div>`).join('');
}

function openDialog(rule) {
  form.reset();
  document.querySelector('#rule-id').value = rule?.id || '';
  document.querySelector('#question').value = rule?.question || '';
  document.querySelector('#response').value = rule?.response || '';
  document.querySelector('#enabled').checked = rule?.enabled ?? true;
  document.querySelector('#dialog-title').textContent = rule ? 'Edit reply' : 'Create a reply';
  dialog.showModal();
  document.querySelector('#question').focus();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

document.querySelector('#new-rule').addEventListener('click', () => openDialog());
document.querySelector('#empty-add').addEventListener('click', () => openDialog());
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#search').addEventListener('input', render);

form.addEventListener('submit', async event => {
  event.preventDefault();
  const id = document.querySelector('#rule-id').value;
  const rule = { id: id || crypto.randomUUID(), question: document.querySelector('#question').value.trim(), response: document.querySelector('#response').value.trim(), enabled: document.querySelector('#enabled').checked, createdAt: new Date().toISOString() };
  if (!rule.question || !rule.response) return;
  if (id) rules = rules.map(item => item.id === id ? rule : item);
  else rules.unshift(rule);
  try {
    await saveRules();
    dialog.close();
    showToast(id ? 'Reply updated and synced' : 'Reply saved and synced');
  } catch {
    showToast('Could not save. Is the QuickReply server running?');
  }
});

list.addEventListener('click', async event => {
  const row = event.target.closest('.rule-row');
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!row || !action) return;
  const rule = rules.find(item => item.id === row.dataset.id);
  if (!rule) return;
  if (action === 'edit') openDialog(rule);
  if (action === 'menu') {
    const shouldDelete = confirm(`Delete this saved reply?\n\n${rule.question}`);
    if (!shouldDelete) return;
    rules = rules.filter(item => item.id !== rule.id);
    try { await saveRules(); showToast('Reply removed'); }
    catch { showToast('Could not save. Is the server running?'); }
  }
});

loadRules();
setInterval(loadRules, 15000);
