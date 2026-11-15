const API = '/api/rules';
let rules = [];
let authMode = 'login';
const list = document.querySelector('#rule-list');
const dialog = document.querySelector('#rule-dialog');
const form = document.querySelector('#rule-form');
const toast = document.querySelector('#toast');
const authScreen = document.querySelector('#auth-screen');
const appShell = document.querySelector('#app-shell');
const cloud = Boolean(window.QUICKREPLY_SUPABASE?.url && window.QUICKREPLY_SUPABASE?.anonKey);
const sb = window.QUICKREPLY_SUPABASE || {};

async function supabase(path, options = {}) {
  await refreshCloudSession();
  const token = localStorage.getItem('quickreplyToken') || sb.anonKey;
  const response = await fetch(`${sb.url}/rest/v1/${path}`, { ...options, headers: { apikey: sb.anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (!response.ok) throw new Error((await response.json()).message || 'Supabase request failed');
  return response.status === 204 ? null : response.json();
}

function setSession(data) {
  localStorage.setItem('quickreplyToken', data.access_token);
  if (data.refresh_token) localStorage.setItem('quickreplyRefreshToken', data.refresh_token);
  if (data.expires_in) localStorage.setItem('quickreplyExpiresAt', String(Date.now() + data.expires_in * 1000));
  localStorage.setItem('quickreplyEmail', data.user.email);
}

function currentUserId() {
  const payload = localStorage.getItem('quickreplyToken').split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '='))).sub;
}

async function refreshCloudSession() {
  if (!cloud) return;
  const expiry = Number(localStorage.getItem('quickreplyExpiresAt') || 0);
  if (!localStorage.getItem('quickreplyRefreshToken') || Date.now() < expiry - 60000) return;
  const response = await fetch(`${sb.url}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { apikey: sb.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: localStorage.getItem('quickreplyRefreshToken') }) });
  const data = await response.json();
  if (!response.ok) { localStorage.removeItem('quickreplyToken'); localStorage.removeItem('quickreplyRefreshToken'); throw new Error('Your session expired. Please sign in again.'); }
  setSession(data);
}

function consumeOAuthHash() {
  if (!cloud || !location.hash.includes('access_token=')) return;
  const values = new URLSearchParams(location.hash.slice(1));
  const token = values.get('access_token');
  const email = values.get('user') ? JSON.parse(values.get('user')).email : '';
  if (token) {
    localStorage.setItem('quickreplyToken', token);
    if (values.get('refresh_token')) localStorage.setItem('quickreplyRefreshToken', values.get('refresh_token'));
    if (values.get('expires_in')) localStorage.setItem('quickreplyExpiresAt', String(Date.now() + Number(values.get('expires_in')) * 1000));
    localStorage.setItem('quickreplyEmail', email);
    history.replaceState(null, '', location.pathname + location.search);
  }
}

function authHeaders(extra = {}) {
  return { ...extra, Authorization: `Bearer ${localStorage.getItem('quickreplyToken') || ''}` };
}

function showAuth(message = '') {
  rules = [];
  appShell.hidden = true;
  authScreen.hidden = false;
  document.querySelector('#auth-error').textContent = message;
}

function showApp(email) {
  authScreen.hidden = true;
  appShell.hidden = false;
  document.querySelector('#account-name').textContent = email;
  document.querySelector('#account-avatar').textContent = email[0].toUpperCase();
  loadRules();
}

function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === 'register';
  document.querySelector('#auth-title').textContent = signup ? 'Create your account' : 'Welcome back';
  document.querySelector('#auth-copy').textContent = signup ? 'Your saved replies will belong to your account.' : 'Sign in to open your saved replies.';
  document.querySelector('#auth-submit').textContent = signup ? 'Create account' : 'Sign in';
  document.querySelector('#auth-toggle-prompt').textContent = signup ? 'Already have an account?' : 'New to QuickReply?';
  document.querySelector('#auth-toggle').textContent = signup ? 'Sign in' : 'Create an account';
  document.querySelector('#auth-password').setAttribute('autocomplete', signup ? 'new-password' : 'current-password');
  document.querySelector('#auth-password').setAttribute('minlength', signup ? '10' : '1');
  const confirmation = document.querySelector('#confirm-password-field');
  const confirmationInput = document.querySelector('#confirm-password');
  confirmation.hidden = !signup;
  confirmationInput.required = signup;
  confirmationInput.value = '';
  document.querySelector('#auth-password').type = 'password';
  confirmationInput.type = 'password';
  document.querySelector('#password-toggle').textContent = 'Show';
  document.querySelector('#password-toggle').setAttribute('aria-pressed', 'false');
  document.querySelector('#auth-error').textContent = '';
}

async function loadRules() {
  const token = localStorage.getItem('quickreplyToken');
  if (!token) return;
  try {
    const response = cloud ? null : await fetch(API, { headers: authHeaders(), cache: 'no-store' });
    if (response?.status === 401) { localStorage.removeItem('quickreplyToken'); localStorage.removeItem('quickreplyEmail'); return showAuth('Your session expired. Please sign in again.'); }
    const data = cloud ? await supabase('reply_rules?select=id,question,response,enabled,created_at&order=created_at.desc') : await response.json();
    if (response && !response.ok) throw new Error('API unavailable');
    rules = cloud ? data : (data.rules || []);
    document.querySelector('#sync-label').textContent = 'Synced just now';
    document.querySelector('.sync-state i').style.background = '#4f8dd1';
    render();
  } catch {
    document.querySelector('#sync-label').textContent = 'Server disconnected';
    document.querySelector('.sync-state i').style.background = '#d89253';
  }
}

async function saveRules() {
  if (cloud) {
    const userId = currentUserId();
    await supabase('reply_rules?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rules.map(rule => ({ id: rule.id, user_id: userId, question: rule.question, response: rule.response, enabled: rule.enabled, created_at: rule.createdAt || new Date().toISOString() }))) });
    await supabase(`reply_rules?id=not.in.(${rules.map(r => r.id).join(',') || '00000000-0000-0000-0000-000000000000'})`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    render(); return;
  }
  const response = await fetch(API, { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ rules }) });
  if (response.status === 401) {
    localStorage.removeItem('quickreplyToken');
    localStorage.removeItem('quickreplyEmail');
    showAuth('Please sign in again to save your replies.');
    throw new Error('Sign in required');
  }
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

document.querySelector('#auth-toggle').addEventListener('click', () => setAuthMode(authMode === 'login' ? 'register' : 'login'));
document.querySelector('#password-toggle').addEventListener('click', () => {
  const password = document.querySelector('#auth-password');
  const confirmation = document.querySelector('#confirm-password');
  const reveal = password.type === 'password';
  password.type = reveal ? 'text' : 'password';
  confirmation.type = reveal ? 'text' : 'password';
  document.querySelector('#password-toggle').textContent = reveal ? 'Hide' : 'Show';
  document.querySelector('#password-toggle').setAttribute('aria-pressed', String(reveal));
});
document.querySelector('#auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  const email = document.querySelector('#auth-email').value.trim().toLowerCase();
  const password = document.querySelector('#auth-password').value;
  if (authMode === 'register' && password !== document.querySelector('#confirm-password').value) {
    document.querySelector('#auth-error').textContent = 'The passwords do not match.';
    return;
  }
  const button = document.querySelector('#auth-submit');
  button.disabled = true;
  button.textContent = authMode === 'register' ? 'Creating account…' : 'Signing in…';
  document.querySelector('#auth-error').textContent = '';
  try {
    let data;
    if (cloud) {
      const response = await fetch(`${sb.url}/auth/v1/${authMode === 'register' ? 'signup' : 'token?grant_type=password'}`, { method: 'POST', headers: { apikey: sb.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, ...(authMode === 'register' ? { options: { emailRedirectTo: location.origin } } : {}) }) });
      data = await response.json();
      if (!response.ok) throw new Error(data.msg || data.message || data.error_description || 'Could not sign in');
      if (authMode === 'register' && !data.access_token) { document.querySelector('#auth-error').textContent = 'Check your Gmail inbox and confirm your email, then sign in.'; return; }
      setSession(data);
    } else {
      const response = await fetch(`/api/auth/${authMode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not sign in');
      localStorage.setItem('quickreplyToken', data.token); localStorage.setItem('quickreplyEmail', data.user.email);
    }
    document.querySelector('#auth-password').value = '';
    showApp(data.user.email);
  } catch (error) {
    document.querySelector('#auth-error').textContent = error.message || 'Could not connect to the server.';
  } finally {
    button.disabled = false;
    button.textContent = authMode === 'register' ? 'Create account' : 'Sign in';
  }
});

document.querySelector('#logout').addEventListener('click', async () => {
  try { if (cloud) await fetch(`${sb.url}/auth/v1/logout`, { method: 'POST', headers: { apikey: sb.anonKey, Authorization: `Bearer ${localStorage.getItem('quickreplyToken')}` } }); else await fetch('/api/auth/logout', { method: 'POST', headers: authHeaders() }); } catch { /* Local sign-out still works offline. */ }
  localStorage.removeItem('quickreplyToken');
  localStorage.removeItem('quickreplyRefreshToken');
  localStorage.removeItem('quickreplyExpiresAt');
  localStorage.removeItem('quickreplyEmail');
  showAuth();
});

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
    showToast('Could not save. Check your connection and sign-in.');
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
    catch { showToast('Could not save. Check your connection and sign-in.'); }
  }
});

async function initialize() {
  consumeOAuthHash();
  document.querySelector('#google-signin').hidden = !cloud;
  document.querySelector('#auth-divider').hidden = !cloud;
  document.querySelector('#local-note').textContent = cloud ? 'Your replies sync securely to your account.' : 'Configure Supabase to enable cloud accounts and syncing.';
  document.querySelector('#google-signin').addEventListener('click', () => { location.href = `${sb.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(location.origin)}`; });
  setAuthMode('login');
  const token = localStorage.getItem('quickreplyToken');
  if (!token) return showAuth();
  let response;
  try {
    if (cloud) {
      await refreshCloudSession();
      const freshToken = localStorage.getItem('quickreplyToken');
      const userResponse = await fetch(`${sb.url}/auth/v1/user`, { headers: { apikey: sb.anonKey, Authorization: `Bearer ${freshToken}` } });
      if (!userResponse.ok) { localStorage.removeItem('quickreplyToken'); return showAuth('Your session expired. Please sign in again.'); }
      const user = await userResponse.json(); return showApp(user.email);
    }
    response = await fetch('/api/auth/me', { headers: authHeaders(), cache: 'no-store' });
  } catch {
    return showAuth('Could not reach QuickReply. Start the local server and try again.');
  }
  if (response.status === 401) {
    localStorage.removeItem('quickreplyToken');
    localStorage.removeItem('quickreplyEmail');
    return showAuth('Your session expired. Please sign in again.');
  }
  if (!response.ok) return showAuth('Could not load your account. Please try again.');
  const data = await response.json();
  showApp(data.user.email);
}

initialize();
setInterval(loadRules, 15000);
