(() => {
  const API = 'http://127.0.0.1:8766/api/rules';
  const MIN_MATCH = 0.72;
  let rules = [];
  let lastFingerprint = '';
  let panel;

  const stopWords = new Set('a an and are as at be by can could did do does for from get has have how i in is it me my of on or our please tell that the this to we what when where which who why with you your'.split(' '));

  function normalize(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function words(text) {
    return new Set(normalize(text).split(' ').filter(word => word.length > 1 && !stopWords.has(word)));
  }

  function similarity(question, message) {
    const q = normalize(question);
    const m = normalize(message);
    if (!q || !m) return 0;
    if (m.includes(q)) return 1;
    const qWords = words(q);
    const mWords = words(m);
    if (!qWords.size || !mWords.size) return 0;
    let common = 0;
    qWords.forEach(word => { if (mWords.has(word)) common++; });
    const coverage = common / qWords.size;
    const jaccard = common / (qWords.size + mWords.size - common);
    return coverage * 0.78 + jaccard * 0.22;
  }

  function currentEmail() {
    const subject = document.querySelector('h2.hP, h2[data-thread-perm-id]')?.innerText?.trim() || '';
    const bodies = [...document.querySelectorAll('.a3s')];
    const body = bodies.at(-1)?.innerText?.trim() || '';
    const senderNode = [...document.querySelectorAll('.gD[email]')].at(-1);
    const sender = senderNode?.getAttribute('email') || senderNode?.innerText || '';
    if (!body) return null;
    return { subject, body, sender };
  }

  function fingerprint(email) {
    const thread = location.hash.match(/#(?:inbox|all|sent|label\/[^/]+)\/([^?]+)/)?.[1] || email.subject;
    const sample = normalize(`${email.sender} ${email.subject} ${email.body}`).slice(0, 400);
    let hash = 2166136261;
    for (let i = 0; i < sample.length; i++) hash = Math.imul(hash ^ sample.charCodeAt(i), 16777619);
    return `${thread}:${(hash >>> 0).toString(36)}`;
  }

  function bestMatch(email) {
    const input = `${email.subject} ${email.body}`;
    return rules.filter(rule => rule.enabled).map(rule => ({ rule, score: similarity(rule.question, input) })).sort((a, b) => b.score - a.score)[0];
  }

  function ensurePanel() {
    if (panel?.isConnected) return panel;
    const host = document.createElement('div');
    host.id = 'quickreply-extension-panel';
    host.style.cssText = 'position:fixed;right:22px;bottom:22px;z-index:2147483647';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>
      *{box-sizing:border-box}aside{font:13px/1.45 Arial,sans-serif;color:#252a24;width:320px;background:#fff;border:1px solid #e3e9e1;border-radius:12px;box-shadow:0 10px 36px #1c322529;overflow:hidden}.head{padding:13px 15px 11px;background:#f3f7f2;display:flex;align-items:center;gap:9px}.mark{width:25px;height:25px;border-radius:8px;background:#4d8662;color:#fff;display:grid;place-items:center;font-weight:bold}.title{font-size:12px;font-weight:700}.sub{font-size:9px;color:#828980;margin-top:2px}.close{margin-left:auto;border:0;background:none;color:#7f857b;font-size:19px;cursor:pointer}.content{padding:14px 15px}.label{font-size:9px;text-transform:uppercase;letter-spacing:.8px;color:#949a90;font-weight:bold}.question{font-size:11px;font-weight:bold;margin:4px 0 8px}.reply{max-height:126px;overflow:auto;white-space:pre-wrap;font-size:11px;color:#5f655c;border:1px solid #edf0eb;border-radius:7px;padding:9px;line-height:1.5}.confidence{font-size:9px;color:#759078;margin:8px 0 11px}.actions{display:flex;gap:7px}.button{height:31px;padding:0 11px;border:1px solid #e1e6de;background:#fff;border-radius:6px;color:#55775c;font-size:10px;font-weight:bold;cursor:pointer}.button.main{background:#4b805b;color:white;border-color:#4b805b;flex:1}.foot{font-size:9px;color:#979c94;margin-top:9px}.warn{color:#b27939}.notice{font-size:10px;color:#578063;margin-top:8px;min-height:13px}
    </style><aside aria-live="polite"><div class="head"><span class="mark">q</span><div><div class="title">QuickReply suggestion</div><div class="sub">A saved answer matches this message</div></div><button class="close" aria-label="Close">×</button></div><div class="content"><div class="label">MATCHED QUESTION</div><div class="question"></div><div class="reply"></div><div class="confidence"></div><div class="actions"><button class="button main">Prepare reply</button><button class="button dismiss">Dismiss</button></div><div class="notice"></div><div class="foot">Draft mode · Review the reply before you send.</div></div></aside>`;
    document.documentElement.append(host);
    panel = host;
    root.querySelector('.close').addEventListener('click', () => host.remove());
    root.querySelector('.dismiss').addEventListener('click', () => host.remove());
    return panel;
  }

  function setNotice(message, warning = false) {
    const root = panel?.shadowRoot;
    if (!root) return;
    const notice = root.querySelector('.notice');
    notice.textContent = message;
    notice.classList.toggle('warn', warning);
  }

  function fillGmailComposer(response) {
    const replyButton = [...document.querySelectorAll('button[aria-label], div[role="button"][aria-label]')]
      .find(button => /^(Reply|Reply to all)$/i.test(button.getAttribute('aria-label') || ''));
    if (!replyButton) return false;
    replyButton.click();
    setTimeout(() => {
      const editor = document.querySelector('[contenteditable="true"][aria-label*="Message Body"], [role="textbox"][g_editable="true"]');
      if (!editor) { setNotice('Gmail did not open a reply. Please try manually.', true); return; }
      editor.focus();
      editor.innerText = response;
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: response }));
      setNotice('Reply prepared. Review it in Gmail before sending.');
    }, 450);
    return true;
  }

  async function autoSend(response, key) {
    const replied = await chrome.storage.local.get({ replied: {} });
    if (replied.replied[key]) return;
    const replyButton = [...document.querySelectorAll('button[aria-label], div[role="button"][aria-label]')]
      .find(button => /^(Reply|Reply to all)$/i.test(button.getAttribute('aria-label') || ''));
    if (!replyButton) { setNotice('Could not safely open a reply. Use Prepare reply instead.', true); return; }
    // Persist first so Gmail DOM changes cannot trigger a duplicate response.
    replied.replied[key] = Date.now();
    await chrome.storage.local.set({ replied: replied.replied });
    replyButton.click();
    setTimeout(() => {
      const editor = document.querySelector('[contenteditable="true"][aria-label*="Message Body"], [role="textbox"][g_editable="true"]');
      if (!editor) { setNotice('Auto-send stopped: Gmail reply box was not found.', true); return; }
      editor.focus();
      editor.innerText = response;
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: response }));
      setTimeout(() => {
        const send = [...document.querySelectorAll('button[aria-label], div[role="button"][aria-label]')]
          .find(button => /^Send$/i.test(button.getAttribute('aria-label') || ''));
        if (send) { send.click(); setNotice('Auto-reply sent.'); }
        else setNotice('Reply prepared, but Gmail did not expose the Send button.', true);
      }, 700);
    }, 500);
  }

  async function showMatch(email, match, key) {
    const root = ensurePanel().shadowRoot;
    root.querySelector('.question').textContent = match.rule.question;
    root.querySelector('.reply').textContent = match.rule.response;
    root.querySelector('.confidence').textContent = `Strong match · ${Math.round(match.score * 100)}% wording overlap`;
    root.querySelector('.notice').textContent = '';
    root.querySelector('.foot').textContent = 'Draft mode · Review the reply before you send.';
    root.querySelector('.button.main').onclick = async () => {
      if (!fillGmailComposer(match.rule.response)) setNotice('Could not find the Gmail Reply button. Open a message and try again.', true);
    };

    const settings = await chrome.storage.local.get({ autoSend: false });
    if (settings.autoSend && match.score >= 0.88) {
      root.querySelector('.foot').textContent = 'Auto-send is on · strong matches send once per message.';
      await autoSend(match.rule.response, key);
    } else if (settings.autoSend) {
      root.querySelector('.foot').textContent = 'Below auto-send threshold · prepare and review manually.';
    }
  }

  async function checkMessage() {
    const email = currentEmail();
    if (!email) return;
    const key = fingerprint(email);
    if (key === lastFingerprint) return;
    lastFingerprint = key;
    try {
      const response = await fetch(API, { cache: 'no-store' });
      if (!response.ok) throw new Error('offline');
      rules = (await response.json()).rules || [];
      const match = bestMatch(email);
      if (!match || match.score < MIN_MATCH) { panel?.remove(); return; }
      await showMatch(email, match, key);
    } catch {
      panel?.remove();
    }
  }

  let timer;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(checkMessage, 500);
  }).observe(document.body, { childList: true, subtree: true });
  setInterval(checkMessage, 5000);
  checkMessage();
})();
