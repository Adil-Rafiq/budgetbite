CREATE TABLE "user_food_preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"restaurant_id" uuid,
	"menu_item_id" uuid,
	"sentiment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ufp_exactly_one_target" CHECK (("user_food_preference"."restaurant_id" IS NOT NULL)::int + ("user_food_preference"."menu_item_id" IS NOT NULL)::int = 1)
);
--> statement-breakpoint
ALTER TABLE "user_food_preference" ADD CONSTRAINT "user_food_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_food_preference" ADD CONSTRAINT "user_food_preference_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_food_preference" ADD CONSTRAINT "user_food_preference_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ufp_user_restaurant_idx" ON "user_food_preference" USING btree ("user_id","restaurant_id") WHERE "user_food_preference"."restaurant_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "ufp_user_menu_item_idx" ON "user_food_preference" USING btree ("user_id","menu_item_id") WHERE "user_food_preference"."menu_item_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "ufp_user_idx" ON "user_food_preference" USING btree ("user_id");