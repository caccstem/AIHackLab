const API = 'http://127.0.0.1:8766';
const cloud = Boolean(QUICKREPLY_SUPABASE?.url && QUICKREPLY_SUPABASE?.anonKey);
const sb = QUICKREPLY_SUPABASE || {};
const connection = document.querySelector('#connection');
const connectionText = document.querySelector('#connection-text');
const count = document.querySelector('#count');
const toggle = document.querySelector('#auto-send');
const statusText = document.querySelector('#status');
let authMode = 'login';

function setSignedIn(signedIn, email = '') {
  document.querySelector('#auth-box').hidden = signedIn;
  document.querySelector('#signed-in').hidden = !signedIn;
  if (signedIn) document.querySelector('#signed-email').textContent = `Signed in as ${email}`;
}

function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === 'register';
  document.querySelector('#auth-mode').textContent = signup ? 'Sign in instead' : 'Create account';
  document.querySelector('#auth-submit').textContent = signup ? 'Create account' : 'Sign in';
  document.querySelector('#password').setAttribute('autocomplete', signup ? 'new-password' : 'current-password');
  document.querySelector('#password').setAttribute('minlength', signup ? '10' : '1');
  document.querySelector('#auth-error').textContent = '';
}

chrome.storage.local.get({ autoSend: false, authToken: '', authEmail: '' }, settings => {
  toggle.checked = settings.autoSend;
  if (settings.authToken) {
    setSignedIn(true, settings.authEmail);
    refresh();
  } else {
    setSignedIn(false);
  }
});

toggle.addEventListener('change', () => {
  chrome.storage.local.set({ autoSend: toggle.checked }, () => {
    statusText.textContent = toggle.checked ? 'Auto-send enabled on this browser.' : 'Draft mode enabled.';
  });
});

document.querySelector('#auth-mode').addEventListener('click', () => setAuthMode(authMode === 'login' ? 'register' : 'login'));
document.querySelector('#auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = document.querySelector('#auth-submit');
  const email = document.querySelector('#email').value.trim().toLowerCase();
  const password = document.querySelector('#password').value;
  button.disabled = true;
  button.textContent = authMode === 'register' ? 'Creating…' : 'Signing in…';
  try {
    const response = await fetch(cloud ? `${sb.url}/auth/v1/${authMode === 'register' ? 'signup' : 'token?grant_type=password'}` : `${API}/api/auth/${authMode}`, { method: 'POST', headers: { ...(cloud ? { apikey: sb.anonKey } : {}), 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || data.message || data.error || 'Could not sign in');
    if (cloud && !data.access_token) throw new Error('Check your email to confirm your account, then sign in.');
    const token = cloud ? data.access_token : data.token;
    const userEmail = data.user.email;
    chrome.storage.local.set({ authToken: token, refreshToken: cloud ? data.refresh_token : '', expiresAt: cloud ? Date.now() + data.expires_in * 1000 : 0, authEmail: userEmail, cloud }, () => {
      document.querySelector('#password').value = '';
      setSignedIn(true, data.user.email);
      refresh();
    });
  } catch (error) {
    document.querySelector('#auth-error').textContent = error.message || 'Could not connect to QuickReply.';
  } finally {
    button.disabled = false;
    button.textContent = authMode === 'register' ? 'Create account' : 'Sign in';
  }
});

async function refresh() {
  const settings = await chrome.storage.local.get({ authToken: '', authEmail: '', cloud: false });
  if (!settings.authToken) return setSignedIn(false);
  const useCloud = cloud && settings.cloud;
  connection.classList.remove('ok');
  connectionText.textContent = 'Connecting to your reply library…';
  count.textContent = '';
  try {
    if (useCloud) await quickReplyRefreshSession();
    const fresh = await chrome.storage.local.get({ authToken: settings.authToken });
    const response = await fetch(useCloud ? `${sb.url}/rest/v1/reply_rules?select=id,question,response,enabled,created_at&order=created_at.desc` : `${API}/api/rules`, { cache: 'no-store', headers: { ...(useCloud ? { apikey: sb.anonKey } : {}), Authorization: `Bearer ${fresh.authToken}` } });
    if (response.status === 401) {
      chrome.storage.local.remove(['authToken', 'authEmail']);
      setSignedIn(false);
      document.querySelector('#auth-error').textContent = 'Please sign in again.';
      return;
    }
    if (!response.ok) throw new Error('Server returned an error');
    const data = await response.json();
    const active = (useCloud ? data : data.rules || []).filter(rule => rule.enabled).length;
    connection.classList.add('ok');
    connectionText.textContent = 'Reply library connected';
    count.textContent = `${active} active`;
  } catch {
    connectionText.textContent = 'QuickReply server is offline';
    count.textContent = '';
  }
}

document.querySelector('#refresh').addEventListener('click', refresh);
document.querySelector('#logout').addEventListener('click', async () => {
  const settings = await chrome.storage.local.get({ authToken: '', cloud: false });
  try { await fetch(settings.cloud && cloud ? `${sb.url}/auth/v1/logout` : `${API}/api/auth/logout`, { method: 'POST', headers: { ...(settings.cloud && cloud ? { apikey: sb.anonKey } : {}), Authorization: `Bearer ${settings.authToken}` } }); } catch { /* Forget this device's token even if offline. */ }
  chrome.storage.local.remove(['authToken', 'refreshToken', 'expiresAt', 'authEmail', 'cloud'], () => setSignedIn(false));
});
setAuthMode('login');
