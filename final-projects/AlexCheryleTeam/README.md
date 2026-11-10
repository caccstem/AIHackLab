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

All 18 lessons can be selected freely. Each quest has 10 questions, a progress trail, a score, and consecutive-answer combos. Words and individual characters require meaning, recognition, accurate writing with stroke order, pinyin, and pronunciation. Phrases remain optional lesson practice without mastery requirements.

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

Each 10-question quiz now stays within 1–3 vocabulary words or phrases (你好 counts as one target). Every selected target receives pinyin and pronunciation in a 10-question quiz; checked writing is included only for vocabulary words and individual characters. Question types are shuffled in short blocks, allowing consecutive questions of the same type, with no run longer than three. Remaining slots reinforce meaning and character recognition. Levels are divided into fixed groups of at most three words; the next quiz stays in the first unfinished group until its required skills are complete. Already mastered targets drop out of that group’s active practice. Meaning and character answer choices come only from the current group, while pinyin questions use tone variations. Mixed review sessions use the same focus grouping. Writing memory checks hide the focus panel so it cannot act as a guide. The path shows the next targets, and test estimates account for group boundaries.

Question plans are fixed when a session starts, so mistakes and hints do not turn the rest of the quiz into a single question type. The normal learning path and Mixed practice shortcut both mix skills; the 1–3-target group and verified-writing mastery requirements remain intact.

## Required level final tests

A level counts as complete only after its practice skills and comprehensive final test are passed. The final unlocks when practice is ready and retakes remain available after an attempt. It covers every vocabulary target’s meaning, Chinese character recognition, pinyin, and microphone pronunciation, plus a separate independent writing check for each distinct character in vocabulary words; phrases are exempt from writing. The first level has 32 checks; final length depends on level content.

Every check must pass in the same final test. Hints and pronunciation model audio are unavailable, skipped checks do not pass, and writing starts on a blank pad with no tracing or stroke hints. Final-test results list checks to review. Passed finals and attempts are saved, and incomplete finals do not count as finished tests.

Practice alone no longer grants level completion or its 100-point reward. Previously earned points remain saved. Final-test completion rewards are issued once, and duplicate result views cannot add points. Learning progress stays below 100% until the final test is passed; ordinary focused practice quizzes remain 10 questions.

Stroke-order demonstrations animate one numbered stroke at a time before tracing practice unlocks. Students can watch again, which restarts the practice sequence. The writing mastery check validates stroke shape, direction, and order; wrong-order strokes are rejected. Final tests remain independent and offer no demonstrations or tracing hints.

## Expanded curriculum

The app now includes 18 lessons and 146 vocabulary/sentence targets. Twelve added lessons cover weather, colors, everyday items, daily activities, ordering food, shopping and paying, clothing and sizes, time and weekdays, transport, body and asking for help, feelings, and home chores. Each new lesson has six vocabulary targets and three practical sentences, organized into three focused groups.

All lessons use mixed 10-question practice, pronunciation checks, demonstrated and checked stroke-order writing, progress tracking, and required comprehensive final tests. Use Find a lesson to jump to a topic. Existing lesson and word IDs are unchanged, preserving earlier progress. Local stroke data covers all 214 curriculum characters.

## Try before buying

Tap any shop item to open a dressing-room preview on the current avatar. Previewing is free and does not change points, ownership, or the saved avatar. Choose Buy & wear to purchase and equip, Wear this item for owned/free items, or Keep my current look to cancel. Even unaffordable items can be previewed; purchase remains disabled until enough points are available.

Avatars now have gentle idle movement, blinking, ear twitches, and a waving greeting. Use Say hi on the home page, Say hello in My avatar, or See it in motion in a try-on preview. All selected animals, clothes, and accessories remain supported, with reduced-motion preferences disabling decorative animation.

## Avatar playroom and soft artwork

Use Play with your avatar from home or My avatar to pet it, share a snack, and play a five-star catch game. Interactions are free and do not alter learning progress, XP, shop points, names, or purchases. Touch-sized controls and reduced-motion preferences are supported.

Avatar artwork now uses rounded paws and bodies, softer outlines, layered fur and clothing shading, cheek gradients, and subtle fur details. Gradient IDs are unique per rendering so multiple differently customized avatars can appear without color collisions. All animals, outfits, colors, accessories, and earlier answer animations remain supported.

## Phrase writing exemption

Curriculum entries are explicitly tagged as words or phrases, rather than classified by character count. All 55 phrase/sentence targets are now excluded from vocabulary mastery and final tests. They remain in optional lesson practice. The 91 word/character targets still require demonstrated, traced, and independently checked stroke-order writing. Short phrases such as 你呢 are exempt, while longer words such as 公共汽车 still require writing. Existing learning records, passed final tests, points, and purchases remain saved.

## Word-only mastery and vocabulary

My vocabulary and mastery counters contain only the 91 vocabulary word/character targets. The 55 phrase/sentence targets remain in lessons via Practice phrases, with focused mixed-skill practice and XP but no mastery records. Word practice and final tests exclude phrases entirely; untouched phrases cannot block word mastery, level completion, or a final-test unlock.

Phrase-only conversation lessons stay open as optional practice without a final test or mastery percentage. The mastery counter covers 17 word-bearing levels while all 18 lessons remain available. Phrase groups rotate after a completed practice session regardless of accuracy; this is practice navigation, not a mastery requirement. Existing records and purchases are preserved, with earlier phrase skill records simply ignored for mastery.

## Quest-based daily streak

Today’s streak activates only after finishing a full 10-question mini quest. Completed review and optional phrase mini quests count too. Visits, daily visit bonuses, individual answers, partial quests, final tests, shopping, and avatar games do not activate the streak. The header and daily rhythm card show pending versus earned status. Only one streak day is recorded per local calendar date; historical streak dates are preserved while the current day requires a qualifying completion.

## Flexible writing size and position

The writing pad now records the whole character as freehand strokes. Draw anywhere on the pad, large or small, then use Check my writing. Undo removes the last stroke. Before grading, the adapter translates and uniformly scales the whole drawing into reference coordinates, preserving proportions, direction, and stroke sequence. It then runs the pinned local Hanzi Writer 3.5.0 stroke matcher through its quiz input bridge. This dependency is intentionally pinned and its internal bridge is covered by tests.

Size and placement do not determine correctness; general shape, correct stroke count, direction, and order still do. The demonstrated/tracing/independent stages and required word final tests remain enforced. Independent and final writing never reveal the model while checking. Automated checks accepted 36 size/position transformations across representative characters and rejected reversed, reordered, missing, and scribbled strokes.

## Pronunciation microphone permission

Pronunciation checks require a successful microphone access check before Start is enabled. Tap Allow microphone, accept the browser prompt, then tap Start pronunciation check. The permission-test audio stream is closed before speech recognition begins. Blocked permissions, missing devices, unsupported browsers, and revoked speech access leave pronunciation pending and show retry instructions. Permission responses from a previous question cannot enable a later check.

Pronunciation now has Record answer and Stop & check controls. Only the primary recognized Mandarin transcript matching the entire target passes; mismatches remain open for retry without mastery credit. This is speech recognition, not individual tone scoring.

## Natural animal avatars

Walking animals now stand on four paws with species-specific tails; rabbits and koalas sit naturally. Smaller heads replace the oversized proportions, and pet outfits fit the horizontal bodies. Dog tails wag faster than cat tails; rabbits hop when greeted. Reduced-motion preferences disable the new animations. All 132 species/outfit SVG combinations validate; try-on, purchases, names, and playroom behavior remain covered by checks.

## English-to-Chinese recall

The last focus group of each lesson, and reviews once word practice is complete, include typed and spoken answers to English translation prompts. Quizzes remain ten questions focused on one to three targets. Every vocabulary word in a final now has a typed Chinese recall check instead of multiple-choice character selection, and an English-prompt spoken check instead of reading the displayed Chinese aloud. Pinyin, meaning, and per-character handwriting/stroke-order checks remain. Phrases stay optional and out of word mastery/finals.

Recall questions hide the focus list and skill checklist so they do not reveal Chinese answers. Typed answers require the taught Chinese characters (spacing and punctuation are ignored), reject pinyin-only answers, and respect keyboard composition. Spoken answers use the existing permission-gated Mandarin recognizer. Mismatches can be retried, with no completion credit until the answer matches. New modes credit existing character/pronunciation skills; saved records, purchases, and previous final completions remain intact. Automated checks cover final coverage, 300 ten-question plans, answer visibility, input matching, composition, skill mapping, and microphone controls. Live browser/microphone QA was unavailable.

## Four writing questions and interactive strokes

Each practice writing task expands into four adjacent questions for the same character: guided stroke-by-stroke practice, full-character tracing, copying with a visible reference, and writing from memory. The guided question animates exactly one stroke, then checks the learner’s own stroke before demonstrating the next. All strokes together count as that single guided question. Shape and direction are validated through the pinned Hanzi matcher while translation and size are normalized. Wrong or missing strokes cannot advance the demo. Each phase scores once; only independent memory completion records writing mastery, and skipped prerequisite phases cannot grant practice mastery. Final exams retain independent writing questions without demonstrations or references.

Quests retain their ten core checks but expand to 10–19 actual questions when writing phases are present. Counters, progress dots, 50/80/100 percent star thresholds, and full-quest streak activation now use actual question totals. Phrases remain exempt from writing. Checks cover 24 individual strokes against real Hanzi matching, 36 transformed whole characters, the four-stage UI, prerequisite gating, 300 mixed plans, expanded-quest scoring/streaks, English recall, and microphone permission controls. Live browser and touch-device QA was unavailable.

## Cute anime avatar style

The selected anime direction adds colored reflective eyes, clean lash lines, soft pastel fur palettes, softer shadows, and cleaner outlines. Natural animal poses, smaller heads, clothing, purchases, and animations are retained. All 132 species/outfit SVG combinations validate, alongside existing shop and playroom checks.

## Fluffy storybook avatars and active playroom

Avatars now follow the supplied fluffy-cat reference with tiny dark eyes, rounded fur contours, warm brown outlines, cream/pastel shading, small smiles, and subtle cheek details. Each species retains its own ears, markings, tail, and natural pose. Outfits, colors, accessories, and saved purchases remain supported. Rendered cat/dog/rabbit/fox previews were inspected, and all 132 species/outfit SVGs validate.

The playroom layers travel, facing, whole-body movement, heads, tails, and paws. Pets nuzzle and close their eyes when petted, dip and bob toward snacks, run and pounce toward alternating star positions, and bounce in celebration after five catches. Animal heads and legs move independently; playroom actions no longer trigger the generic greeting wave. Targets stay within mobile-friendly bounds, keyboard focus follows the next catch target, and reduced-motion settings disable movement while retaining controls. No animation timers need cleanup. Checks cover directional chasing, target positions, five-star completion, replay/reset guards, shop previews and purchases, and unchanged points/learning state. Live browser animation QA was unavailable; SVG artwork was rendered locally.

## Reference seated pose

All animal avatars now use the supplied picture’s upright seated pose: front paws together, a curled tail beside the body, and a raised paw with visible pads. Clothing fits the front-facing torso. Animal features and fur colors remain distinct, with rabbit head placement adjusted for long ears. The raised paw has separate pet/snack/catch/celebration motions, and tail animation pivots at its attachment. Human avatars retain their existing pose. Cat and rabbit SVG previews were rendered and inspected; all 132 species/outfit variants validate, and shop/purchase/playroom state checks pass.

## Reference-first avatar rebuild

The animal renderer was rebuilt with new organic contours, an integrated fluffy silhouette, asymmetric ears, tiny eyes, a small curled mouth, cream shading, and a subtle procedural paper/pigment texture. The raised paw now sits beside the face, with a round belly and curled tail matching the supplied reference more closely. Each species retains its distinctive ears and markings; existing animation group hooks remain available.

A free Just fluff outfit exposes the natural fur. The original free sage default switches to this option once, while purchased/equipped alternatives and all owned items remain saved. Users can still equip any clothing style, color, and accessory. All 143 species/outfit SVGs validate; rendered cat and rabbit previews were inspected. Rebuild-specific checks cover texture hooks, fur-only rendering, outfit overlays, accessories, preview safety, and unchanged playroom/game state. Live browser animation QA was unavailable.

Avatar anatomy correction: the pointed right ear now uses a separate closed outline whose base sits behind the head. The long center-leg outline was removed; all animal variants now have exactly two short lower-leg shapes. Rendered cat preview inspected, all 143 SVG combinations validate, and shop/playroom regression checks pass.

Removed the raised paw and its unused animation rules. Pointed right ears now mirror the exact left-ear geometry, including the inner ear, so both sides have equal dimensions. Exactly two resting legs remain. Rendered cat preview inspected; all species/outfit SVGs validate and shop/playroom checks pass.

Animal heads are now uniformly 10% smaller, scaling the face, ears, markings, and head accessories together around the neck attachment. The independent head animation wrapper remains intact. Rendered cat preview inspected; all species/outfit head transforms and SVG structure checked, with shop/playroom regressions passing.

Refined proportions: animal heads are another 11% narrower while keeping their height, and ears scale 15% larger relative to the head around their base. Both pointed ears still share mirrored geometry. The ear scale uses an inner wrapper so ear-twitch animation cannot replace the sizing transform. Rendered cat preview inspected; variant structure, two legs/no raised paw, shop, and playroom checks pass.

Straightened the animal head artwork: symmetrical cheek contours and a centered chin replace the slanted silhouette; eyes, cheeks, mouth, whiskers, and glasses are level. Narrower head proportions and larger mirrored ears remain. Rendered cat preview inspected, eye alignment checked across all animal outfits, and shop/playroom checks pass.

Fixed detached round ears on tiger, panda, and bear avatars. Closed circular outer/inner ears now extend behind the head at their bases, keeping both sides matched. All three rendered previews were inspected; SVG variants and shop/playroom checks pass.
