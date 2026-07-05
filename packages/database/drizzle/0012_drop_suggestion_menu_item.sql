ALTER TABLE "meal_suggestion" DROP CONSTRAINT "meal_suggestion_menu_item_id_menu_item_id_fk";
--> statement-breakpoint
ALTER TABLE "meal_suggestion" DROP COLUMN "menu_item_id";