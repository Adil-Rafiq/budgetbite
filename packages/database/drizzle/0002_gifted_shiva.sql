CREATE TABLE "plan_context" (
	"budget_plan_id" uuid PRIMARY KEY NOT NULL,
	"total_budget" numeric(12, 2) NOT NULL,
	"amount_spent" numeric(12, 2) DEFAULT '0' NOT NULL,
	"amount_remaining" numeric(12, 2) NOT NULL,
	"total_meals" integer NOT NULL,
	"meals_consumed" integer DEFAULT 0 NOT NULL,
	"meals_remaining" integer NOT NULL,
	"avg_budget_per_remaining_meal" numeric(10, 2) NOT NULL,
	"cumulative_variance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"disliked_restaurant_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preferred_cuisine_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"disliked_cuisine_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dietary_notes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"feedback_summary" text,
	"price_sensitivity" text DEFAULT 'mid' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plan_context" ADD CONSTRAINT "plan_context_budget_plan_id_budget_plan_id_fk" FOREIGN KEY ("budget_plan_id") REFERENCES "public"."budget_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;