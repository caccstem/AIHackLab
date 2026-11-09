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

All 18 lessons can be selected freely. Each quest has 10 questions, a progress trail, a score, and consecutive-answer combos. Words become fully learned after meaning, Chinese character recognition, writing practice, toned pinyin, and pronunciation checks.

Handwriting is integrated into the learning path. A level’s Mixed practice button starts a mixed-skill review quest. Each exercise requires watching an animated stroke-order demonstration, tracing the character in that order, and then writing independently on a cleared pad with the guide hidden. All distinct characters in a word must be practiced to complete its writing check. Hanzi Writer now validates stroke shape, direction, and order in both stages. Only successful independent checks count toward mastery; there is no manual completion button. The standalone Writing tab has been removed.

Microphone pronunciation checks require browser speech-recognition support and permission. Skipping or denying a microphone check leaves that skill pending. Recognition checks spoken words, not individual tone accuracy. Hinted answers do not complete independent skill checks.

## Rewards and avatars

- A daily visit awards 5 avatar points once per local calendar day.
- First passing a level’s required final test awards 100 points; a perfect replay of a mastered level awards 25.
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

Hanzi Writer 3.5.0 and local stroke data for all 214 curriculum characters are bundled with the app. Drawings remain in the browser. Tracing must pass before a blank memory check begins; no stroke hints or forced passes are enabled during the memory check. Incorrect strokes must be retried. A failed checker load leaves writing pending. Previous self-marked writing records are reset for verification while points, other skills, and purchases remain saved. This is geometric stroke checking with tolerance, not a guarantee of calligraphic quality.

Third-party notices are in `vendor/`: Hanzi Writer uses the MIT license; character data from Make Me A Hanzi/Arphic is distributed under the Arphic Public License.

## Focused quizzes

Each 10-question quiz now stays within 1–3 vocabulary words or phrases (你好 counts as one target). Every selected target receives pinyin, pronunciation, and checked writing in the same 10-question quiz. Question types are shuffled in short blocks, allowing consecutive questions of the same type, with no run longer than three. Remaining slots reinforce meaning and character recognition. Levels are divided into fixed groups of at most three words; the next quiz stays in the first unfinished group until its required skills are complete. Already mastered targets drop out of that group’s active practice. Meaning and character answer choices come only from the current group, while pinyin questions use tone variations. Mixed review sessions use the same focus grouping. Writing memory checks hide the focus panel so it cannot act as a guide. The path shows the next targets, and test estimates account for group boundaries.

Question plans are fixed when a session starts, so mistakes and hints do not turn the rest of the quiz into a single question type. The normal learning path and Mixed practice shortcut both mix skills; the 1–3-target group and verified-writing mastery requirements remain intact.

## Required level final tests

A level counts as complete only after its practice skills and comprehensive final test are passed. The final unlocks when practice is ready and retakes remain available after an attempt. It covers every vocabulary target’s meaning, Chinese character recognition, pinyin, and microphone pronunciation, plus a separate independent writing check for each distinct character in every target. The first level has 32 checks; final length depends on level content.

Every check must pass in the same final test. Hints and pronunciation model audio are unavailable, skipped checks do not pass, and writing starts on a blank pad with no tracing or stroke hints. Final-test results list checks to review. Passed finals and attempts are saved, and incomplete finals do not count as finished tests.

Practice alone no longer grants level completion or its 100-point reward. Previously earned points remain saved. Final-test completion rewards are issued once, and duplicate result views cannot add points. Learning progress stays below 100% until the final test is passed; ordinary focused practice quizzes remain 10 questions.

Stroke-order demonstrations animate one numbered stroke at a time before tracing practice unlocks. Students can watch again, which restarts the practice sequence. The writing mastery check validates stroke shape, direction, and order; wrong-order strokes are rejected. Final tests remain independent and offer no demonstrations or tracing hints.

## Expanded curriculum

The app now includes 18 lessons and 146 vocabulary/sentence targets. Twelve added lessons cover weather, colors, everyday items, daily activities, ordering food, shopping and paying, clothing and sizes, time and weekdays, transport, body and asking for help, feelings, and home chores. Each new lesson has six vocabulary targets and three practical sentences, organized into three focused groups.

All lessons use mixed 10-question practice, pronunciation checks, demonstrated and checked stroke-order writing, progress tracking, and required comprehensive final tests. Use Find a lesson to jump to a topic. Existing lesson and word IDs are unchanged, preserving earlier progress. Local stroke data covers all 214 curriculum characters.

## Try before buying

Tap any shop item to open a dressing-room preview on the current avatar. Previewing is free and does not change points, ownership, or the saved avatar. Choose Buy & wear to purchase and equip, Wear this item for owned/free items, or Keep my current look to cancel. Even unaffordable items can be previewed; purchase remains disabled until enough points are available.

Avatars now have gentle idle movement, blinking, ear twitches, and a waving greeting. Use Say hi on the home page, Say hello in My avatar, or See it in motion in a try-on preview. All selected animals, clothes, and accessories remain supported, with reduced-motion preferences disabling decorative animation.
