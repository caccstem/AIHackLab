# Small Steps · Learn Mandarin

Team members: Alex, Cheryl

A mobile-friendly Mandarin learning app with a soft blue theme, a home-page chibi avatar, and bottom navigation for learning, vocabulary, avatars, and conversation.

## Run locally

From this folder:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. No installation or build is required.

## Learning quests

All six levels can be selected freely. Each quest has 10 questions, a progress trail, a score, and consecutive-answer combos. Words become fully learned after meaning, Chinese character recognition, writing practice, toned pinyin, and pronunciation checks.

Handwriting is integrated into the learning path. A level’s Practice writing button starts a focused writing quest. Each exercise requires tracing a character and then writing it independently on a cleared pad with the guide hidden. All distinct characters in a word must be practiced to complete its writing check. Hanzi Writer now validates stroke shape, direction, and order in both stages. Only successful independent checks count toward mastery; there is no manual completion button. The standalone Writing tab has been removed.

Microphone pronunciation checks require browser speech-recognition support and permission. Skipping or denying a microphone check leaves that skill pending. Recognition checks spoken words, not individual tone accuracy. Hinted answers do not complete independent skill checks.

## Rewards and avatars

- A daily visit awards 5 avatar points once per local calendar day.
- First mastering a level awards 100 points; a perfect replay of a mastered level awards 25.
- Quest stars require 5, 8, or 10 independent correct answers. Each new personal-best star awards 5 points once per level. Review and focused writing quests do not grant star treasure.
- Game score and XP are separate from spendable avatar points.
- Name and customize a chibi explorer, cat, dog, rabbit, or panda. Answer animations use the saved name and current appearance.

Progress, rewards, avatar names, purchases, and writing practice save in the current browser. No sign-in is required; progress does not sync across devices. Existing points and purchases are preserved when learning requirements change.

Each level displays its mastery percentage, progress bar, fully learned words, and remaining skill checks. Expand See skill progress for meaning, characters, writing, pinyin, and pronunciation counts. The selected level also shows progress in the home hero and quest results. Progress updates after leaving an unfinished quest and is independent of quest star ratings.

In My avatar, trade 50 XP for 5 avatar points. Each trade deducts XP and adds points immediately; insufficient balances disable the exchange. Trading does not reduce earned daily-goal progress or word mastery.

The avatar shop has 10 animals plus the human explorer: cat, dog, rabbit, panda, fox, bear, tiger, koala, mouse, and red panda. Choose from 12 outfits (sweaters, hoodies, jacket, raincoat, overalls, dress, T-shirt, sailor), 10 additional clothing colors, and natural or alternate fur colors. Clothing style and color equip separately. Existing names, points, and purchases remain saved.

After each completed 10-question lesson, an optional Snack Match study break offers a six-card, three-pair matching game with the named avatar. Finding all pairs awards 3 avatar points once per lesson. The break can be skipped or resumed from lesson results while the same lesson session remains open. Starting a new quest begins a new session. Breaks do not change word mastery or quest stars.

Level progress includes completed level-test counts and an “at least” remaining-test estimate. Remaining questions include each missing non-writing skill and each unpracticed character-writing task, divided into 10-question tests. Misses, hints, and repeated tasks can require more tests. The counter uses existing saved completed level quests; incomplete sessions, mixed reviews, and writing-only practice do not inflate it. The home adventure card also shows total tests finished.

## Checked handwriting

Hanzi Writer 3.5.0 and local stroke data for all 83 curriculum characters are bundled with the app. Drawings remain in the browser. Tracing must pass before a blank memory check begins; no stroke hints or forced passes are enabled during the memory check. Incorrect strokes must be retried. A failed checker load leaves writing pending. Previous self-marked writing records are reset for verification while points, other skills, and purchases remain saved. This is geometric stroke checking with tolerance, not a guarantee of calligraphic quality.

Third-party notices are in `vendor/`: Hanzi Writer uses the MIT license; character data from Make Me A Hanzi/Arphic is distributed under the Arphic Public License.
