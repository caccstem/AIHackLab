# Study Grove
A public study site with independent Study Grove accounts. No ChatGPT sign-in is required.

Signup asks for a username, nickname/name, current grade, and password. Students then choose goals, subjects, daily focus time, and theme. Preferences remain editable from the workspace. Each account has private cloud-saved notes, assignments, flashcards, and progress.

## Accounts
Account and session records are in D1. Passwords use a random salt and native scrypt (N=16384, r=8, p=5); plain passwords are never stored. Sessions use random 256-bit tokens, with only token hashes in D1, 30-day expiry, and HttpOnly SameSite=Lax cookies (Secure on HTTPS). Authentication is rate-limited per username and IP. State-changing endpoints require same-origin requests. Password recovery uses a one-time random recovery code; resetting rotates that code and revokes existing sessions. No email or full legal name is required.

Workspace APIs select only the signed-in account ID and use revision checks to reject conflicting edits. Private responses disable caching. Failed saves show retry or conflict guidance; export backup downloads current work.

Earlier browser-local data and ChatGPT-linked workspaces remain stored separately and are not automatically assigned to a new username account. Local music files stay on their device.

## Development and validation
Use the Sites install/build helpers with Node >=22.13. Generate schema migrations using `npm run db:generate`. Hosting configuration is `.openai/hosting.json`; deployment applies committed D1 migrations.

Run `node --test tests/workspace-api.cjs` for workspace authorization and revision checks. With the built Worker running locally on port 8787 and local migrations applied, `python3 tests/own-accounts.py` verifies signup, personalization, login, account isolation, saving, recovery, and logout.

## Friends and private messages
Grades include 5th grade through college (plus Other), editable in preferences. The Friends & messages tab in the left sidebar supports exact-username requests, accepting or declining requests, removing friends, blocking, and unblocking. Only accepted, unblocked friends can read or write their conversation. Responses include nicknames and usernames, not grade or account credentials. Messages are stored in D1, support pagination and send deduplication, and refresh every five seconds while the tab is visible. Focus mode hides messaging. Message text is rendered as plain text.

With local migrations applied and the built Worker on port 8787, `python3 tests/friends.py` verifies three-account message isolation, pending-request restrictions, persistence, pagination, duplicate sends, blocking, removal, and grade changes.

## Clock tools and music
The header shows the device's live local date and time. Clock tools include a general countdown, a stopwatch with laps, and selectable world clocks with IANA time zones. World clock choices save to the account. Running timers and the stopwatch continue across in-app sections; closing or reloading the page resets them.

Music lets each student type their own Spotify search (opened in Spotify), paste a chosen Spotify share link, and save up to 20 named tracks, albums, artists, or playlists. Only validated Spotify identifiers are embedded. Spotify controls playback availability and its own sign-in. No Spotify API credentials are stored. Existing ambient tones and local audio remain available under focus setup.

`node --test tests/time-music.cjs` checks countdown/stopwatch behavior, saved world clocks, Spotify search routing, and validation of embedded links. External Spotify playback and visual browser QA have not been verified here.

## Settings, personal pictures, and group chats
Settings supports password-protected username changes, password changes with session renewal and other-device sign-out, and an optional phone number. Users can explicitly share their phone number with accepted friends. The Messages link opens the device's own SMS/Messages application; it does not send texts automatically or import phone replies into Study Grove. Phone numbers are not included in group-member lists.

Users can upload or remove a profile picture and private background picture (JPG, PNG, or WebP, max 2 MB). Images live in the private R2 BUCKET. Authenticated image routes authorize each read; backgrounds are owner-only, and avatars are limited to the owner, unblocked accepted friends, and active members of shared groups. Uploads validate file signatures and sizes, never accept SVG, and remove replaced objects. Backgrounds apply only to the owner's study space.

Group chats support named groups, invitations to accepted friends, join/decline, inviting additional friends, and leaving. Unaccepted invitations do not grant message access. Group messages are paginated, deduplicated, and visible only to active members. Blocking filters messages between those accounts in shared groups. Direct and group chats use two columns: others on the left and the signed-in user's messages on the right. Enter sends; Shift+Enter adds a line.

Validation: `node --test tests/chat-ui.cjs` checks opening direct/group chats, both message columns, Messages links, and Enter behavior. Local Worker integration tests `tests/settings-groups.py` and `tests/pictures.py` verify reauthentication, session revocation, phone sharing, group membership/privacy, private image upload/read/delete, and file validation. Live device Messages launching and visual browser QA remain unverified.

## Ready-made flashcard library
The Flashcards tab includes 132 starter topic decks (429 cards) across Math, Biology, Chinese, Science, ELA, History, Geography, Computer science, and Study skills. Filters support subject, suggested grade band, and keyword search. Students can preview each deck, add it without duplicates, restore deleted starter cards, and practice a selected topic separately from other cards. Custom cards remain supported. Suggested levels are approximate; the collection is introductory and does not claim a complete curriculum or every possible topic.

`node --test tests/catalog.cjs` validates topic content structure, filtering, previews, deduplication, topic-specific practice, restoration, and custom cards.

## Languages and Chinese
The language picker provides built-in core-control translations for English, Simplified Chinese, Traditional Chinese, Spanish, French, German, Portuguese, Italian, Arabic, Hindi, Japanese, and Korean. Arabic changes the page direction to RTL. Selection is remembered in a locale cookie and, once signed in to the workspace, in the saved account workspace. Public signup and personalization pages also include the picker. Browser translation instructions are provided for other languages; the site does not claim native support for every language.

Personal messages, names, notes, custom cards, and the existing educational content stay in their original language and are not sent to an external translation service. Option values remain canonical when labels are translated. Dates and clocks use the selected locale. The Chinese beginner subject contains 10 decks and 63 cards covering greetings, numbers, pronouns, family, weekdays, colors, school, question words, pinyin, and simple sentences. Cards include both scripts and Mandarin pinyin.

`node --test tests/language.cjs` validates matching language packs, both Chinese variants, reversible switching, preserved user content/form values, account persistence, and RTL.

## Adaptive typed practice and language learning
The Flashcards tab supports adaptive typed answers alongside original card review. Three correct answers raise difficulty one level (maximum 5); an error lowers it one level (minimum 1). Numeric math generators cover supported math topics; other cards generate exact-word cloze recall from existing answers. These are spelling/keyword checks, not semantic essay grading. Equivalent fractions, supported numeric scripts, punctuation, and case have explicit matching rules. Questions do not repeat within the active practice session unless the user explicitly chooses Review again. Only a bounded recent history and progress are saved; full-session uniqueness does not extend indefinitely across reloads. Pools are large but finite, and exhaustion is shown honestly. No runtime AI service invents new subject facts.

Language practice is a separate tab with 30 widely spoken languages and 10 beginner concepts per language. Difficulty increases from single words to ordered bundles of up to four vocabulary items. Native script and listed romanizations are accepted. Meaningful accents and script marks are preserved. Mandarin supports both Chinese scripts. The word lists are introductory, contextual forms vary, and these are not complete language courses or coverage of every world language.

A small practice stopwatch sits in the corner, auto-starts with practice, and supports pause and reset. It resets on page reload. `tests/adaptive.cjs` checks numeric grading, parameterized equations, difficulty changes, nonrepeating questions, and vocabulary checks. `tests/adaptive-ui.cjs` checks typed input, double-submit protection, progress persistence, and the stopwatch.

## Friend identity layout
Friend rows use a fixed circular picture/initial and a separate flex text block containing nickname and username. Long names truncate without wrapping around pictures; buttons wrap onto a separate line on narrow screens. Missing or failed pictures keep a nickname-initial placeholder, including non-Latin names. `tests/chat-ui.cjs` covers pictured and unpictured contacts and failed-image fallback.
