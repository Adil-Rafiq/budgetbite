CREATE TABLE "meal_suggestion_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"suggestion_id" uuid NOT NULL,
	"item_index" integer NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"estimated_price" numeric(10, 2),
	CONSTRAINT "valid_item_index" CHECK ("meal_suggestion_item"."item_index" >= 0)
);
--> statement-breakpoint
ALTER TABLE "meal_suggestion_item" ADD CONSTRAINT "meal_suggestion_item_suggestion_id_meal_suggestion_id_fk" FOREIGN KEY ("suggestion_id") REFERENCES "public"."meal_suggestion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_suggestion_item" ADD CONSTRAINT "meal_suggestion_item_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_suggestion_item_index" ON "meal_suggestion_item" USING btree ("suggestion_id","item_index");