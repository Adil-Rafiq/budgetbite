ALTER TABLE "menu_item" ADD COLUMN "category" text;--> statement-breakpoint
CREATE INDEX "menu_item_restaurant_category_name_idx" ON "menu_item" USING btree ("restaurant_id","category","name");--> statement-breakpoint
CREATE INDEX "menu_item_restaurant_price_idx" ON "menu_item" USING btree ("restaurant_id","price");