# QuickReply

QuickReply is a local MVP for managing frequently asked questions and using their saved answers in Gmail. The dashboard and Chrome extension read and write through the same local API, so updates show up in the extension while the local server is running.

## Start the dashboard and API

From this folder, run:

```bash
python3 server.py
```

Open <http://127.0.0.1:8766>. Add a question and the response you want your team to use. Rules are saved on this computer in `data/rules.json` (the file is intentionally ignored by Git).

## Load the Chrome extension

1. Keep `server.py` running.
2. In Chrome, open `chrome://extensions` and switch on **Developer mode**.
3. Select **Load unpacked** and choose this project's `extension` folder.
4. Open or refresh Gmail. Open an email to see a saved answer when the question wording is a strong match.
5. Use **Prepare reply** to put the answer in Gmail's reply box, then review and send it yourself.

The extension checks the latest visible Gmail message against active rules. Its default mode prepares a draft only. The extension popup has an opt-in **Auto-send strong matches** switch. Auto-send requires a stronger wording match, sends at most once for the same visible message, and depends on Gmail's page structure; keep draft mode on until you've reviewed its behavior.

## Current MVP limits

- Gmail in Chrome is the only supported inbox. Other email and messaging providers need their own integrations.
- The API binds to `127.0.0.1`, so this is a single-computer prototype, not a hosted multi-user service. Dashboard rules and extension suggestions sync through that local process; the extension does not currently sync rules across computers.
- There is no account system, team access control, cloud storage, audit log, or deployment setup yet. Do not expose the local API to the public internet or store sensitive customer data in this prototype.
- Matching uses lightweight word overlap. Review suggested replies before enabling auto-send; Gmail DOM changes can also affect reply insertion.

## Project layout

- `server.py` — local API and static web server
- `web/` — reply library dashboard
- `extension/` — Chrome Manifest V3 extension for Gmail
- `data/rules.json` — local rules database created on first save
