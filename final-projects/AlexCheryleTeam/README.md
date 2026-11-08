# Small Steps · Learn Mandarin

Team members: Alex, Cheryl

A Mandarin learning app with six progressive levels, adaptive vocabulary questions, pronunciation audio, guided conversations, and a handwriting practice pad. Progress is saved locally in the browser.

## Run locally

From this folder, run:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000 in your browser. No installation or build is required.

Speech recognition requires a supported browser and microphone permission; typing is available as a fallback. The handwriting pad supports freehand practice without automatic grading.

## Avatar rewards

Earn 100 avatar points the first time a level is mastered, or 25 points for a perfect replay of a completed level. Spend points in My avatar on hair, outfits, accessories, and backgrounds. Skin tones and starter items are free. Completed levels from earlier versions receive 100 points each. Points, purchases, and the equipped avatar save locally in the browser.

Avatar companions include free cats and dogs, plus a rabbit (75 points) and panda (100 points). Animal avatars support fur colors, outfits, accessories, and backgrounds. Existing balances and purchases are preserved.

All six levels are open from the start. Choose any level on the learning path; the app remembers your selection. Vocabulary and writing practice cover all levels. Skipping does not mark levels complete or grant points.

Answer feedback animates the equipped avatar: correct answers trigger a celebratory jump with stars, while mistakes trigger an encouraging sway with hearts. Reactions also appear in guided conversations and respect reduced-motion preferences.

Avatars use a chibi anime style with oversized heads, sparkling eyes, blush, and tiny sweater outfits. All animal choices, accessories, colors, and answer animations remain supported.

Daily visits award 5 avatar points once per local calendar day, with a welcome message and collected indicator. Sign-in is optional; claims are stored in this browser with learning progress.

## Phone layout

Open the same site URL on a phone. Small screens use bottom navigation, 44-pixel minimum tap targets, 16-pixel input text, scrollable lessons, safe-area spacing, stacked conversation controls, and a fluid touch drawing pad. Avatar purchases and learning progress stay in the browser used on that device.

Writing studio requires two steps: trace the selected character, then write it independently on a cleared pad with the guide and character picker hidden. Both steps require drawing before completion. A reference appears beside the finished writing for self-comparison; no automatic handwriting grading is performed. Trace again restarts both steps.
