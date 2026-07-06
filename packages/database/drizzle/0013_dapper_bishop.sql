CREATE TABLE "meal_slot_reroll" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_plan_id" uuid NOT NULL,
	"generation_id" uuid NOT NULL,
	"slot_date" date NOT NULL,
	"meal_type_id" uuid NOT NULL,
	"rejected_options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meal_slot_reroll" ADD CONSTRAINT "meal_slot_reroll_budget_plan_id_budget_plan_id_fk" FOREIGN KEY ("budget_plan_id") REFERENCES "public"."budget_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_slot_reroll" ADD CONSTRAINT "meal_slot_reroll_generation_id_meal_plan_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."meal_plan_generation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_slot_reroll" ADD CONSTRAINT "meal_slot_reroll_meal_type_id_meal_type_id_fk" FOREIGN KEY ("meal_type_id") REFERENCES "public"."meal_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meal_slot_reroll_slot_idx" ON "meal_slot_reroll" USING btree ("generation_id","slot_date","meal_type_id");