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

## Included recipes (43)

- Crafting Table; Stick (4); Furnace; Bowl (4).
- Wooden Pickaxe, Wooden Axe, Wooden Shovel, Wooden Hoe, Wooden Sword.
- Stone Pickaxe, Stone Axe, Stone Shovel, Stone Hoe, Stone Sword.
- Iron Pickaxe, Iron Axe, Iron Shovel, Iron Hoe, Iron Sword.
- Bucket; Shield; Flint and Steel.
- Iron Helmet, Iron Chestplate, Iron Leggings, Iron Boots.
- Oak Boat, Spruce Boat, Birch Boat, Jungle Boat, Acacia Boat, Dark Oak Boat.
- Oak Door, Spruce Door, Birch Door, Jungle Door, Acacia Door, Dark Oak Door (3 per craft).
- Bread; Gold Ingot from nine Gold Nuggets; Block of Gold from nine Gold Ingots.
- Eye of Ender; Blaze Powder (2).

Counts omitted above are one. This is a documented starter selection, not every vanilla recipe. Wood alternatives and stone material alternatives come from the actual item tags used by each recipe. Generic recipes such as sticks and wooden tools accept every vanilla planks alternative allowed by their tag, including mixed variants. Boats and doors use their specific wood type. Cooking, smelting and blasting are excluded.

## Modes and controls

**Game** selects tier 1 recipes initially, unlocks tier 2 after three target successes, and tier 3 after six. A correct target answer earns 100 points once and consumes one ingredient per occupied slot. A miss or “I don’t know” damages the player, saves the weakness, and ends the question. Use Next recipe to proceed. Zero health ends the session and shows its final score. Restart resets the session, not learning progress. There is no timer or personal best.

**Practice** has no survival penalty. A first miss reveals an English-language visual explanation and saves the weakness. Retry the same question without changing its first recorded result, or continue. Output/item labels and search terms follow the language setting.

**Review** samples only unmastered missed recipes. Weight is `1 + total mistakes`. The previous question is excluded whenever another weak recipe is available. A session lasts 10 first answers, or ends when its weak pool is empty. Accuracy is correct first answers divided by attempted first answers. Retrying does not add attempts, successes or mastery. Consulting the current solution in the recipe book before submission marks the question assisted; it cannot earn independent review credit. A subsequent submission is recorded as missed. Looking at another recipe does not affect the current question.

Mastery needs `3 + min(total mistakes, 5)` consecutive correct independent review answers. A miss resets the streak. A mastered recipe missed in another mode returns to the pool with its historical mistakes intact. Each recipe tracks attempts, mistakes, successful reviews, streak and mastery. Empty states distinguish no misses from all mastered recipes.

**Easy inventory** contains the exact canonical ingredient quantities for the target. **Hard inventory** starts empty and provides a searchable creative inventory of the 59 relevant ingredients and outputs. Selecting an item picks up a full Minecraft-sized stack (or one with Place one enabled); it does not automatically find target ingredients. Both options work in all modes. Changing inventory difficulty rebuilds the current inventory; changing language preserves the grid, held items and session.

- Left-click: pick up, place, stack or swap.
- Right-click: take half a stack or place one.
- With items held, left-drag over grid slots divides the stack evenly, leaving any remainder in hand. Right-drag places one per eligible slot. Full and incompatible slots are skipped.
- Direct dragging from inventory moves a stack to the release slot; pick it up first to distribute across multiple slots.
- Touch: tap to pick up/place; enable **Place one** for individual placements.
- Keyboard: Tab to a slot, Enter/Space to pick up/place, Shift+Enter/Space to split/place one.
- Clear grid returns grid and held stacks to inventory, merging within actual stack limits.
- The output is a live preview. Only **Check recipe** or **I don’t know** submits an answer. Survival crafting has its own action.

## Survival model

This is an explicit turn-based training model, not Minecraft combat physics. Values are exported in `src/engine.ts` (`CONFIG` and `armorPoints`).

- Start at 20 health, 20 hunger and 5 saturation.
- Each first-answer miss deals 6 damage, reduced by 2.5% per armor point. Iron helmet/chestplate/leggings/boots provide 2/6/5/2 points. Armor does not wear out.
- A successful target answer heals 2 health when hunger is at least 18 and saturation at least 1; healing consumes 1 hunger and 1 saturation.
- Bread restores 5 hunger and 3 saturation, capped at 20/5, then triggers the same healing check. Healing never revives a finished run.
- The free supply chest works in both inventory difficulties and supplies 24 iron ingots and 9 wheat per visit. Craft bread or iron armor in **survival supply mode**, then use Eat/Equip in the sidebar. These crafts consume ingredients, give usable outputs, and award no target points or learning successes. Reopening the chest replaces the working inventory; Return to target refills Easy target ingredients. Supplies are intentionally unlimited so all recipes remain survivable with deliberate preparation.
- Armor is equipped per body slot and does not stack with a second copy. Shields are craftable target items, not armor in this model.

## Data provenance and updating

`data/vanilla.json` retains the extracted official recipe JSON, item tags and language dictionaries. `data/trainer.json` is its compact runtime subset, generated by `scripts/prepare-data.py`. `src/data.ts` normalizes these into stable IDs, output counts, shaped/shapeless patterns, accepted alternatives, quantities, difficulty, localized item names and search terms. Labels never serve as IDs.

The source is **Mojang’s official Java 1.16.1 client**, located through the [official version manifest](https://piston-meta.mojang.com/mc/game/version_manifest_v2.json). The client SHA-1 is `c9abbe8ee4fa490751ca70635340b7cf00db83ff`; its hash is checked before extraction. The Norwegian file is `minecraft/lang/no_no.json` in that version’s asset index; its content hash is checked too. English comes from `assets/minecraft/lang/en_us.json` in the client. Recipes come from `data/minecraft/recipes/` and ingredient tags from `data/minecraft/tags/items/`. Textures are extracted from the same client. The shield fallback is a small CSS drawing because the game renders its icon from an entity model.

To reproduce the extraction (requires internet, curl and Python 3):

```sh
python3 scripts/import-minecraft.py
npm run test:all
npm run build
```

To add recipes, extend the importer’s explicit ID selection, run it again, and assign a suitable training difficulty in `src/data.ts`. A version change also requires updating the importer, visible version labels and tests; do not relabel the current data as another version.

The book includes English/Norwegian recipe search terms, Looting III / Plyndring III, and separate lava/silverfish sound subtitle entries from the official language data. `Local Difficulty` has no Norwegian localization key in the 1.16.1 language dictionary. The displayed `Lokal vanskelighetsgrad` is explicitly marked as a descriptive translation, not an official localized string. No recipes or item translations remain unverified for this selection.

## Persistence and verification limits

Language, inventory difficulty and learning progress use the versioned `crafting-fieldnotes-v1` localStorage key. Missing, invalid and incompatible saves fall back safely; malformed learning entries are skipped. Storage failures display an in-app notice. Reset progress requires confirmation and keeps language/difficulty. Session health and scores are intentionally not persisted.

Automated verification covers every shaped offset, horizontal mirror and permitted alternative across all included recipes, shapeless arrangements, invalid extras, stack conservation/limits, drag distribution, consumption/output counts, damage/healing/armor/game over, mastery/weighted selection, save validation, official localized names, explicit submissions, one-time scoring, assisted reviews, review accuracy, survival crafts/eating/equipping, and normalized Norwegian search.

Direct-file loading is tested with external network responses disabled, including crafting, texture file paths and language switching; the Vite entry transformation is checked separately. The browser automation host was unavailable during implementation. The application passed TypeScript, production build, engine tests and automated React DOM flows, but real-browser visual QA and physical touch-device testing remain unverified. Responsive CSS covers desktop and narrow screens. Fonts use Google Fonts with local system fallbacks; the app logic and textures do not need external services.

Minecraft textures and game data belong to Mojang/Microsoft. This is an unofficial training tool, not affiliated with Mojang or Microsoft.
