-- Custom SQL migration file, put your code below! --

-- Every pre-combo suggestion carried exactly one menu item directly on the
-- row. Materialize it as a single-item combo so the follow-up migration can
-- drop meal_suggestion.menu_item_id losslessly.
INSERT INTO "meal_suggestion_item" ("suggestion_id", "item_index", "menu_item_id", "estimated_price")
SELECT "id", 0, "menu_item_id", "estimated_price"
FROM "meal_suggestion";
