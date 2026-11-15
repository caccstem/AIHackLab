// Use the same public Supabase project URL and anon/publishable key as web/supabase-config.js.
// Never put a service_role key here.
globalThis.QUICKREPLY_SUPABASE = { url: '', anonKey: '' };
globalThis.quickReplyRefreshSession = async function () {
  const config = globalThis.QUICKREPLY_SUPABASE;
  if (!config.url || !config.anonKey) return;
  const state = await chrome.storage.local.get({ authToken: '', refreshToken: '', expiresAt: 0 });
  if (!state.refreshToken || Date.now() < state.expiresAt - 60000) return;
  const response = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { apikey: config.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: state.refreshToken }) });
  if (!response.ok) { await chrome.storage.local.remove(['authToken', 'refreshToken', 'expiresAt', 'authEmail']); throw new Error('Session expired'); }
  const session = await response.json();
  await chrome.storage.local.set({ authToken: session.access_token, refreshToken: session.refresh_token, expiresAt: Date.now() + session.expires_in * 1000, authEmail: session.user.email });
};
