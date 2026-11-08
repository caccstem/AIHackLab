# Crafting Fieldnotes

A local Minecraft Java **1.16.1** crafting trainer for speedrunning, built with React, TypeScript and Vite. Everything for this implementation lives in `final-projects/AngelaCarinaTeam/angs-attempt`. The neighboring project and ESP32 project are unchanged.

## Run

From this directory, using Node 22.18+ (tested on Node 26):

```sh
npm install
npm run dev
```

You can use either of these:

- **Local server:** run `npm run dev` and open the URL Vite prints, normally http://127.0.0.1:5173. Keep the terminal running while you use it.
- **Open the file:** double-click this folder’s `index.html` in Finder, or run `open index.html` from a terminal already in `angs-attempt`. No server or npm command is needed to use this version. Keep `standalone/` and `public/` alongside the HTML file, since they contain the bundled code, styling and textures.

The direct-file version is prebuilt. After editing source files, run `npm run build:standalone` to refresh it; `npm run dev` and `npm run build` also refresh it automatically at startup. Localhost uses live TypeScript source with Vite updates. Browser storage for a file URL and localhost is separate, so progress does not automatically transfer between the two. Some browsers restrict storage for file URLs; the app shows a notice if saving is unavailable.

For a production build, run `npm run build` and serve `dist/` with a static server. Vite uses relative asset paths for hosting under a subdirectory.

```sh
npm test          # recipe engine, inventory, survival, progress and language tests
npm run test:ui   # React DOM interaction flows, using jsdom and Vite middleware
npm run test:standalone # direct-file loading and Vite entry checks
npm run test:all  # all suites
npm run build    # TypeScript check and production bundle
```

## Full recipe catalog

The target is Minecraft Java **1.16.1**, using all **647 crafting recipe entries** from its official client:

- 491 shaped and 143 shapeless recipes, including non-speedrunning recipes and all wood/color variants.
- 13 special families: leather armor dyeing, banner duplication, written-book cloning, firework rockets, firework stars, star fade colors, map cloning, map extending, item repair, shield decoration, shulker-box coloring, suspicious stew and tipped arrows.

The complete source catalog is in `data/vanilla.json`; `data/trainer.json` contains its runtime recipe data, used tags and localized item names. Cooking, smelting, blasting, smoking, stonecutting and smithing are not crafting-table recipes and are excluded. Furnace crafting itself is included.

Every entry works as a task in Practice/Game. Review/Test use only entries actually flagged by the player, never filler recipes. Some recipes produce the same item by different ingredients; each vanilla recipe ID remains a distinct task and historical record. The Recipe Book and creative inventory are searchable and paginated to keep the expanded catalog manageable.

Special recipes provide canonical valid examples plus their ingredient-rule handlers and explanations. State-dependent inputs use labeled training variants, such as a patterned banner, original written book, or map scale. Output counts, map scales, shulker dye colors and retained original books/banners are handled. RGB blending, enchantments, durability arithmetic, banner design editing, book content, stored shulker contents and potion/flower effect NBT are not simulated. This is a crafting-ingredient/layout trainer, not a full Minecraft item-state editor. Unknown/model-only item icons use a labeled fallback tile.

## Selection and approved language content

`src/preferences.ts` is the explicit configuration source for classification, weighting, search-crafting hints and vocabulary. Speedrunning recipes have weight **4**, other recipes **1**. Practice uses weighted selection; Review combines this preference with cycle-difficulty weight **after** filtering history, mastery and spacing; Test orders its fixed eligible list by weighted sampling without replacement. Every eligible non-speedrunning recipe has positive selection probability. A test still includes its whole eligible pool once, so weighting favors order rather than excluding recipes. Game uses the full catalog and unlocks higher ingredient-count tiers as score increases.

The speedrunning classification covers iron/stone tools; golden pickaxe/axe; shears; sticks; iron/gold ingots; pressure plates; buckets; doors; boats; wool; beds; flint and steel; bows; respawn anchors; blaze powder; eyes of ender; golden helmets; nether bricks; bread. It follows output IDs, so alternate recipes and wood/color variants are classified consistently.

Only Practice references for speedrunning outputs show instructional search-crafting hints, and only literal strings from `SEARCH_HINTS` for the selected language. Slashes, capitalization and Norwegian letters are preserved. Multiple approved strings are retained. Missing mappings show nothing; there is no generated ingredient-name hint and no English fallback. Ordinary inventory searches still use complete localized item names.

The Norwegian vocabulary panel contains exactly the user's eleven supplied pairings, including the supplied spellings and pairings that differ from official translations. It deliberately does not expand or correct them. Normal item-name translations remain the official Norwegian localization.

## Modes, history, and learning

**Practice** offers unlimited crafting without a survival penalty. A first incorrect submission or “I don’t know” saves a mistake and opens a correction. Retry without recording another answer, or continue.

**Game** awards 100 points once per correct target and increases recipe difficulty after every three successes. A miss or “I don’t know” causes damage and saves a mistake. First-try edible outputs can be eaten or stored, and correctly crafted iron armor can be equipped in the sidebar. There is no timer, personal best or resource-granting mechanism.

**Review** unlocks permanently after mistakes on **11 distinct recipes** from Practice/Game. Repeated mistakes on one recipe do not advance the distinct count. Before unlocking, the tab shows progress such as 8/11. It remains accessible even with an empty active backlog. Within Review, choose **Active review** or **Additional review** of previously flagged, currently mastered recipes, then Check available reviews. Review is learning only: no score, percentage or test-result screen.

History is sorted by latest mistake and includes localized name, source (Practice, Game, Additional review), date, status and remaining successful reviews. Stable recipe IDs prevent duplicate records when switching language.

`src/progression.ts` owns the rules independently from the UI:

- The first Practice/Game mistake in a learning cycle requires **2** successful reviews. Further Practice/Game mistakes before mastery require **4, 8, 16, …** (`2 ^ cycle mistakes`) and restart successful progress at zero.
- A correct, unassisted, first required Review answer adds one success. An incorrect answer, I don’t know or solution reveal resets successes without increasing its cycle mistake count. Opening the current solution in the Recipe Book also counts as a reveal.
- Completing the required reviews marks the recipe mastered and removes it from the active backlog. Its history stays available for optional Additional review.
- A correct optional review leaves mastery and the active backlog unchanged. An incorrect or revealed optional review **re-flags** the recipe, starts a fresh cycle at **1 mistake / 2 required reviews**, records Additional review as its source, and removes it from the Test question pool. A new Practice/Game mistake after mastery also starts at two.
- At least **10 other completed questions** must intervene between Review appearances, including optional ones: A, ten intervening completions, A (positions 1 and 12 at the earliest). A completed Practice/Game appearance of A resets its interval too. Opening a question, navigation and retries do not increment completion or reset scheduling. Each resolved Practice/Game/Review question advances the global counter exactly once; Tests never do.
- Spacing persists across refreshes and restarts. No eligible review means an explanatory waiting state with the exact number of required intervening completions. No early repetition or invented history fillers are substituted.

**Test Mode** dynamically requires **10 currently unmastered flagged recipes** at the time a test starts. It locks again below ten. Historical/lifetime mistakes, ever-mastered counts and the old permanent Test flag do not unlock it. This gate is separate from its question pool: tests contain only **previously flagged, currently mastered recipes**. A large enough backlog with no mastered pool gets a distinct explanatory empty state.

A started test captures its fixed, weighted question list; every selected ID appears once, and its length is the eligible pool size. Only first answers count. Solutions/retries are unavailable during the test; scores and corrections appear after submitting the completed test. Test answers never change cycles, mastery or spacing. The most recent 20 results are saved separately. Active tests are not resumed after refresh or switching modes.

## Inventory and controls

Easy supplies the canonical ingredients in valid stack sizes. Hard provides searchable full-sized creative stacks and requires finding ingredients. All four modes support either difficulty. Changing difficulty rebuilds the current inventory; language switching preserves the question, grid, held stack and learning progress.

- Left-click picks up the **whole stack**, including with Place one enabled. It places/merges within stack limits or swaps incompatible stacks.
- Right-click with no held item takes half, rounded up; with an item held it places exactly one.
- With a stack held, left-drag divides it evenly across eligible crafting slots, retaining remainder. Right-drag places one per eligible slot. Full/incompatible slots are skipped.
- Direct dragging from inventory moves a stack to the release slot; pick it up first to distribute.
- The held stack/quantity follow the pointer; the inventory also has a holding indicator. Context menus are suppressed over interactive areas.
- Touch: tap and use Place one for precise placements. Keyboard: Tab to slots, Enter/Space to pick up/place; Shift+Enter/Space to split/place one.
- Clear grid returns all items, respecting limits. Successful recipes consume inputs and keep crafting remainders such as empty milk buckets and original books/banners where required.
- Only Check recipe, I don’t know or an explicit Review reveal resolves a question. Retrying never creates an independent success or spacing completion.

## Game survival, hunger and earned food

Game rules live in `src/game.ts`; configurable health/healing/armor values are in `src/engine.ts`. Learning progress remains independent and unchanged.

- Start with 20 health, 20 hunger and 5 saturation. Hunger is shown as **ten icons**, each worth two points, with half-filled icons for odd points. Saturation is always clamped between zero and current hunger.
- Each Game question gets a stable `session UUID:sequence` ID. Its first resolution is recorded once, whether correct, incorrect or I don’t know. At completed counts **5, 10, 15, …**, directly subtract exactly **one hunger point** even with saturation available. Ingredient placement, retries, navigation, eating and storing never advance this counter. The next threshold is displayed beside food.
- Each miss deals 6 damage, reduced by 2.5% per equipped armor point. Iron helmet/chestplate/leggings/boots provide 2/6/5/2 points. A correct target heals 2 health when hunger ≥18 and saturation ≥1, consuming 1 saturation. To keep depletion predictable, healing no longer deducts an extra hunger point. There is no passive/exhaustion hunger drain.
- Correct target food crafts qualify **only on the first answer without a revealed solution**. The actual output quantity becomes one pending reward stack, keyed by that question ID. A failed first answer, I don’t know, solution consultation or unscored retry cannot award food. Nonfoods such as wheat never qualify. Food rewards exist only in Game.
- **Eat now** consumes one item from the pending reward; **Store food** transfers its remaining quantity exactly once to stored food. These actions share the same stack. Food stays pending across next-question navigation until used or stored. Stored food is displayed with icon, localized name, quantity, hunger restoration and actual saturation restoration.
- All eating requires hunger below 20 and a living player. At full hunger, eating is disabled with an explanation; storing remains available. One eating action always consumes exactly one item.
- `data/foods.json` centrally stores the 39 official food items' base nutrition and saturation modifier, extracted from the hash-verified Java 1.16.1 `Foods` class with its official mappings. Restoration is **base nutrition × modifier × 2**, never the capped amount of hunger recovered. Hunger caps at 20; restored saturation caps at resulting hunger. For example, bread restores 5 hunger and 6 saturation; golden carrots restore 6 and 14.4. After restoration, eating triggers the existing two-health healing check if injured, potentially spending one saturation but no hunger.
- Bowl foods return a bowl; honey bottles return a glass bottle. These containers are counted in the run's visible **Kept containers** inventory. Food status effects (such as golden apple effects and flower-dependent suspicious stew) and chorus teleportation are not simulated; affected foods say so explicitly. Honey's poison-removal behavior has no effect because poison is not simulated. Cake is a placed block eaten in seven bites, not an ordinary edible item: earned cake can be stored, but its Eat action is disabled with that explicit limitation; displayed restoration is per bite (2 hunger, .4 saturation).
- Zero health ends the run and eating cannot revive it. Starting/restarting Game clears its question ledger, threshold counter, food, pending rewards and containers. **Active runs are not resumed** after refresh or switching modes; these start fresh runs rather than replaying old food rewards. Long-term language/difficulty/learning history still persist. Shields remain target recipes, not armor in this model.

## Shared inventory icon audit

The crimson-planks recipe is unchanged and verified against the official `crimson_stems` ingredient tag: **crimson stem, stripped crimson stem, crimson hyphae, stripped crimson hyphae**. Its canonical English ingredient is **Crimson Stem**, not “crimson log.” It produces four planks. The bug was displaying a vertically animated raw block texture as though it were an inventory icon.

`scripts/render-icons.py` reads the verified official client item/block model hierarchy, texture bindings, element/face UVs, GUI rotation/scale, element rotations and animation metadata. It selects a square animation frame and renders model geometry into a transparent **64×64 inventory icon**. Generated/layered flat items also use square frames. It never substitutes a guessed similar item's texture. `src/data.ts` now resolves only this audited icon manifest; all grids, references, outputs, inventories and held stacks use the same `Icon` component, square bounds, aspect-ratio preservation and crisp nearest-neighbor pixels. A failed image load switches visibly to a question-mark fallback rather than becoming invisible.

The contact sheet `data/wood-icon-audit.png` was visually inspected: all ordinary wood, log, stem, hypha, stripped and plank families render as single, proportionate inventory blocks. `data/icon-audit.json` records model IDs, dimensions, bounding boxes, animated source/frame dimensions and unsupported renderers. `data/icon-coverage.json` lists **622 rendered / 692 relevant stable item IDs**, with **70 explicit fallbacks**. Remaining cases require Minecraft's entity or item-tint providers (not missing texture files): mainly beds, banners, shulker boxes, chests, shields/skulls, tinted leather items, potions/arrows and firework stars. They are visibly labeled, not silently assigned another item. Model lighting is a static software approximation; full GPU lighting, tint providers, enchantment glints and entity-model icons are not implemented.

Reproduce the food extraction and inventory renders after downloading official data (Pillow and JDK `javap` are required for this offline development step; end users need neither):

```sh
python3 scripts/extract-foods.py
python3 -m venv .tools
.tools/bin/python -m pip install Pillow
.tools/bin/python scripts/render-icons.py
node scripts/audit-icon-coverage.mjs
npm run build
```

The checked-in/generated PNGs and food JSON are used directly at runtime. `prepare-data.py` preserves only audited icons and cannot regress to raw block strips.

## Data provenance and updating

`data/vanilla.json` retains the extracted official recipe JSON, item tags and language dictionaries. `data/trainer.json` is its compact runtime subset, generated by `scripts/prepare-data.py`. `src/data.ts` normalizes these into stable IDs, output counts, shaped/shapeless patterns, accepted alternatives, quantities, difficulty, localized item names and search terms. Labels never serve as IDs.

The source is **Mojang’s official Java 1.16.1 client**, located through the [official version manifest](https://piston-meta.mojang.com/mc/game/version_manifest_v2.json). The client SHA-1 is `c9abbe8ee4fa490751ca70635340b7cf00db83ff`; its hash is checked before extraction. The Norwegian file is `minecraft/lang/no_no.json` in that version’s asset index; its content hash is checked too. English comes from `assets/minecraft/lang/en_us.json` in the client. Recipes come from `data/minecraft/recipes/` and ingredient tags from `data/minecraft/tags/items/`. Textures are extracted from the same client. Entity/tint-dependent icons use explicit question-mark fallbacks; they are listed in the icon coverage report.

To reproduce the extraction (requires internet, curl and Python 3):

```sh
python3 scripts/import-minecraft.py
npm run test:all
npm run build
```

The importer selects every `minecraft:crafting_*` entry for this version. `src/special.ts` defines special-family templates and ingredient checks. `python3 scripts/verify-special-data.py` disassembles the official special recipe classes with their Mojang mappings (requires JDK javap) for rule verification; it never runs Minecraft. A version change requires updating data, special handlers, version labels and tests together.

## Persistence, migration, and checks

The existing `crafting-fieldnotes-v1` key is retained, using payload **schema 3**. Saved fields include language/difficulty, history, cycles, current mastery, spacing, global completions, permanent **Review** unlock and separate completed Test results. **Test availability is always derived**, never stored as a permanent flag.

Version 2 saves retain their cycles, history, mastery and global counter; their permanent Test flag is ignored. Review unlock is derived from known distinct history and then persisted. Existing completion timestamps/counters now use the ten-question interval. Version 1 saves lacked reliable source/date/spacing data: known settings and explicit mastery are preserved, legacy aggregates remain separate, unknown dates/sources stay visibly unknown, and imported weak recipes start a conservative two-review cycle. No historical mastery event is inferred from partial successes. Missing/malformed saves fall back safely, and blocked storage displays a notice. Reset requires confirmation and clears progress/unlocks/results while preserving language and difficulty.

Run `npm run test:all` and `npm run build`. Verification covers the entire catalog's valid canonical examples, shaped offsets/mirroring/alternatives, shapeless matching, special ingredient rules/output/remainders, stack conservation/controls, literal hint allowlists, exact vocabulary pairings, weighting/non-speedrunning reachability, permanent eleven-recipe Review unlock, dynamic backlog-based Test gating, optional review re-flagging, exponential cycles, exact nine-versus-ten spacing, migration/persistence, and no test effects on learning. React DOM flows exercise actual controls and reference content; the standalone check disables external network resources.

TypeScript, production builds, engine/progression tests, React DOM flows and direct-file loading are verified. Wood inventory renders were visually checked from the generated contact sheet. Full real-browser visual QA and physical touch-device testing remain unverified. Fonts have system fallbacks, and application data/textures are local. The expanded catalog increases bundle size; browser asset compression is recommended for hosted deployment.

Minecraft textures and game data belong to Mojang/Microsoft. This is an unofficial training tool, not affiliated with Mojang or Microsoft.
