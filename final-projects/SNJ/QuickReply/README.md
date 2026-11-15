Team member list: Sophie Sim, Jennifer Zhou


# QuickReply

QuickReply manages frequently asked questions and uses their saved answers in Gmail. It supports local development and has a Supabase cloud integration for user accounts, email confirmation, Google sign-in on the website, and per-user reply syncing.

## Start the dashboard and API

From this folder, run:

```bash
python3 server.py
```

Open <http://127.0.0.1:8766> and add a question and response. With empty Supabase config, the development server stores accounts and replies locally under ignored `data/`. To enable hosted accounts and syncing, follow [`supabase/SETUP.md`](supabase/SETUP.md), configure `web/supabase-config.js` and `extension/config.js`, and apply [`supabase/schema.sql`](supabase/schema.sql).

## Load the Chrome extension

1. Keep `server.py` running.
2. In Chrome, open `chrome://extensions` and switch on **Developer mode**.
3. Select **Load unpacked** and choose this project's `extension` folder.
4. Open or refresh Gmail. Open an email to see a saved answer when the question wording is a strong match.
5. Use **Prepare reply** to put the answer in Gmail's reply box, then review and send it yourself.
6. Sign in to the extension with the same email and password. With Supabase configured, the extension reads the account's cloud replies directly.

The extension checks the latest visible Gmail message against active rules. Its default mode prepares a draft only. The extension popup has an opt-in **Auto-send strong matches** switch. Auto-send requires a stronger wording match, sends at most once for the same visible message, and depends on Gmail's page structure; keep draft mode on until you've reviewed its behavior.

## Current MVP limits

- Gmail in Chrome is the only supported inbox. Other email and messaging providers need their own integrations.
- Local mode stores data only on this computer. Supabase cloud mode requires a project, provider setup, database schema, and static hosting; those account-specific settings are not included in this repository.
- Google sign-in is wired for the website. The extension supports cloud email/password sign-in; Google sign-in inside the extension is not enabled yet.
- Confirmation email delivery to arbitrary customer addresses requires custom SMTP configuration in Supabase. Do not expose the local API to the public internet or store sensitive customer data in local prototype mode.
- Matching uses lightweight word overlap. Review suggested replies before enabling auto-send; Gmail DOM changes can also affect reply insertion.

## Project layout

- `server.py` — local API and static web server
- `web/` — reply library dashboard
- `extension/` — Chrome Manifest V3 extension for Gmail
- `data/rules.json` — local rules database created on first save
