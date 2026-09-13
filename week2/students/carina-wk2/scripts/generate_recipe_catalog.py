#!/usr/bin/env python3
"""Build the browser recipe catalog from minecraft-data and a requested-name list."""

import json
import sys
from collections import Counter
from pathlib import Path


def pattern_from_shape(shape):
    pattern = [None] * 9
    for row_index, row in enumerate(shape):
        for column_index, item_id in enumerate(row):
            pattern[row_index * 3 + column_index] = item_id
    return pattern


def unique_patterns(patterns):
    seen = set()
    result = []
    for pattern in patterns:
        marker = tuple(pattern)
        if marker not in seen:
            seen.add(marker)
            result.append(pattern)
    return result


def main():
    if len(sys.argv) != 5:
        raise SystemExit(
            "usage: generate_recipe_catalog.py ITEMS_JSON RECIPES_JSON REQUESTED_TEXT OUTPUT_JS"
        )

    items_path, recipes_path, requested_path, output_path = map(Path, sys.argv[1:])
    items = json.loads(items_path.read_text())
    recipes = json.loads(recipes_path.read_text())
    requested = requested_path.read_text().splitlines()[0]
    by_id = {item["id"]: item for item in items}

    # The supplied file is a space-separated display-name export, so match the
    # canonical names from minecraft-data instead of trying to split on spaces.
    selected = [
        item for item in items
        if item["displayName"] in requested and str(item["id"]) in recipes
    ]

    catalog_recipes = []
    used_ids = set()
    for output in selected:
        variants = recipes[str(output["id"])]
        for shapeless in (False, True):
            matching = [recipe for recipe in variants if ("ingredients" in recipe) == shapeless]
            if not matching:
                continue

            patterns = []
            for recipe in matching:
                if shapeless:
                    pattern = list(recipe["ingredients"]) + [None] * (9 - len(recipe["ingredients"]))
                else:
                    pattern = pattern_from_shape(recipe["inShape"])
                patterns.append(pattern)
                used_ids.update(item_id for item_id in pattern if item_id is not None)

            patterns = unique_patterns(patterns)
            ingredient_count = sum(item_id is not None for item_id in patterns[0])
            stock_counts = Counter(item_id for item_id in patterns[0] if item_id is not None)
            difficulty = 1 if ingredient_count <= 2 else 2 if ingredient_count <= 4 else 3 if ingredient_count <= 6 else 4
            recipe_entry = {
                "difficulty": difficulty,
                "title": f"Craft {output['displayName']}",
                "description": "Arrange the ingredients using the vanilla Minecraft recipe.",
                "result": output["displayName"],
                "resultIcon": output["name"],
                "xp": 50 + ingredient_count * 25,
                "stock": {by_id[item_id]["name"]: count for item_id, count in stock_counts.items()},
                "shapeless": shapeless,
            }
            named_patterns = [
                [by_id[item_id]["name"] if item_id is not None else None for item_id in pattern]
                for pattern in patterns
            ]
            if len(named_patterns) == 1:
                recipe_entry["pattern"] = named_patterns[0]
            else:
                recipe_entry["patterns"] = named_patterns
            catalog_recipes.append(recipe_entry)
            used_ids.add(output["id"])

    catalog_items = {
        by_id[item_id]["name"]: {
            "name": by_id[item_id]["displayName"],
            "icon": by_id[item_id]["name"],
            "stackSize": by_id[item_id]["stackSize"],
        }
        for item_id in sorted(used_ids)
    }
    payload = {"version": "1.21.8", "items": catalog_items, "recipes": catalog_recipes}
    output_path.write_text(
        "// Generated from PrismarineJS minecraft-data 1.21.8; do not edit by hand.\n"
        "const VANILLA_RECIPE_CATALOG = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n"
    )
    print(f"Generated {len(catalog_recipes)} recipe challenges using {len(catalog_items)} items.")


if __name__ == "__main__":
    main()
