const connection = document.querySelector('#connection');
const connectionText = document.querySelector('#connection-text');
const count = document.querySelector('#count');
const toggle = document.querySelector('#auto-send');
const statusText = document.querySelector('#status');

chrome.storage.local.get({ autoSend: false }, settings => { toggle.checked = settings.autoSend; });
toggle.addEventListener('change', () => {
  chrome.storage.local.set({ autoSend: toggle.checked }, () => {
    statusText.textContent = toggle.checked ? 'Auto-send enabled on this browser.' : 'Draft mode enabled.';
  });
});

async function refresh() {
  connection.classList.remove('ok');
  connectionText.textContent = 'Connecting to your reply library…';
  count.textContent = '';
  try {
    const response = await fetch('http://127.0.0.1:8766/api/rules', { cache: 'no-store' });
    if (!response.ok) throw new Error('Server returned an error');
    const data = await response.json();
    const active = (data.rules || []).filter(rule => rule.enabled).length;
    connection.classList.add('ok');
    connectionText.textContent = 'Reply library connected';
    count.textContent = `${active} active`;
    statusText.textContent = '';
  } catch {
    connectionText.textContent = 'QuickReply server is offline';
    statusText.textContent = 'Start server.py, then refresh.';
  }
}

document.querySelector('#refresh').addEventListener('click', refresh);
refresh();
