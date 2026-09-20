# The Last Clue

A standalone browser escape-room game set in the sprawling Blackthorn Manor, with a 3D mansion exterior and four enlarged interiors, built with WebGL and plain JavaScript. No installation or build step is required.

Open `index.html` in a browser, or serve from the workspace root:

```sh
python3 -m http.server 8080 --directory house-of-three
```

Visit `http://localhost:8080`.

The homepage includes a new-game button, saved-game continuation, and a How to Play guide. Use Home during play to return without losing progress. Starting over asks before replacing an unfinished save.

Explore the bathroom, living room, bedroom, and kitchen. Each room has three puzzle-locked keys and four passcode fragments hidden in separate locations. Each fragment reveals one digit of its unique door code and its position. Both all three keys and the correct code are required to advance. Finish all four rooms to escape.

- WASD: move through the viewing area.
- Arrow keys or mouse drag: look left, right, up, and down.
- Click labeled markers: investigate puzzles and passcode fragments.
- J: open the notebook.
- Escape: close the current dialog.
- Touch buttons: move, turn, and look up/down on mobile.

Every room mixes a hard math key puzzle with two non-math riddles or logic challenges, including a cryptarithm, multi-stage ciphers, truth-role deductions, and constrained word puzzles. Each room’s passcode fragments also mix two math clues with two wordplay or general-knowledge clues.

Hints are optional, attempts are unlimited, and progress saves locally when browser storage is available. The notebook preserves solved answers and only the passcode fragments you have actually discovered in the current room. A replay button appears after escaping.

The renderer uses WebGL depth testing, perspective-correct textures, hardware clipping, and cached room geometry, with procedural wood, stone and fabric textures, individually laid floors, detailed furniture, brass fixtures, windows, curtains, and soft light falloff. Movement is bounded and checks furniture collision; diagonal movement has the same speed as forward movement. The camera can look up and down. Markers avoid each other and the controls, and keyboard/touch movement clears when a dialog opens or the window loses focus. A simpler Canvas renderer is used when WebGL is unavailable. Fonts optionally load from Google Fonts; system fallbacks work offline.

Validation: JavaScript parsed and game progression exercised with a DOM stub, covering all twelve keys, wrong answers, missing-key rejection, wrong codes, four room transitions, notebook records, and victory. Homepage and bathroom appearance were also checked with Chrome headless screenshots. The updated homepage, continuation flow, and all four room renders passed a DOM/Canvas-stub regression check.

The harder puzzle set was checked independently: exhaustive searches confirm unique solutions for the jar, portrait, wardrobe, witness-role, and SEND + MORE puzzles; a shortest-path search verifies the bridge minimum. Word transformations, the two-phase bath, clock timing, and all sixteen passcode fragments were also checked against their answers. Existing saves remain usable; start a new escape to tackle every revised puzzle.

Stability checks: headless Chrome exercised all four rooms at desktop and 390px phone widths, checking GPU errors over full turns and vertical look, non-overlapping reachable markers, bedroom collision, normalized diagonal movement, all keys, and every exit. The Canvas fallback was smoke-tested across 48 room/camera combinations. Save cleanup and input/dialog guards were also checked.

To repeat the browser checks, run the static server above and open `http://localhost:8080/tests/regression.html`. Choose desktop or phone. The test iframe disables save writes.

Mansion setting: the homepage now shows a three-storey estate with projecting wings, corner towers, a columned entrance, formal gardens, and a fountain. The four playable rooms now have 20 × 18 floor footprints and 8-unit ceilings, with side windows, pilasters, chandeliers, fireplaces, and wider exploration bounds. Chrome screenshot inspection and the all-room rendering, movement, clue, and progression regression checks passed after expansion.
