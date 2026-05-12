CREATE TABLE "meal_pin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"budget_plan_id" uuid NOT NULL,
	"slot_date" date NOT NULL,
	"meal_type_id" uuid NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"price_at_pin" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "meal_choice" ADD COLUMN "restaurant_id" uuid;--> statement-breakpoint
ALTER TABLE "meal_choice" ADD COLUMN "menu_item_id" uuid;--> statement-breakpoint
ALTER TABLE "meal_pin" ADD CONSTRAINT "meal_pin_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_pin" ADD CONSTRAINT "meal_pin_budget_plan_id_budget_plan_id_fk" FOREIGN KEY ("budget_plan_id") REFERENCES "public"."budget_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_pin" ADD CONSTRAINT "meal_pin_meal_type_id_meal_type_id_fk" FOREIGN KEY ("meal_type_id") REFERENCES "public"."meal_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_pin" ADD CONSTRAINT "meal_pin_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_pin" ADD CONSTRAINT "meal_pin_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_pin_slot" ON "meal_pin" USING btree ("budget_plan_id","slot_date","meal_type_id");--> statement-breakpoint
CREATE INDEX "meal_pin_plan_date_idx" ON "meal_pin" USING btree ("budget_plan_id","slot_date");--> statement-breakpoint
ALTER TABLE "meal_choice" ADD CONSTRAINT "meal_choice_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_choice" ADD CONSTRAINT "meal_choice_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE set null ON UPDATE no action;