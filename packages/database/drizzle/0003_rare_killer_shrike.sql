ALTER TABLE "meal_plan_generation" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "meal_plan_generation" ADD COLUMN "error_code" text;--> statement-breakpoint
ALTER TABLE "meal_plan_generation" ADD COLUMN "error_message" text;--> statement-breakpoint
ALTER TABLE "meal_plan_generation" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
UPDATE "meal_plan_generation" SET "status" = 'succeeded', "completed_at" = "generated_at";--> statement-breakpoint
CREATE INDEX "meal_plan_generation_pending_idx" ON "meal_plan_generation" USING btree ("budget_plan_id") WHERE "meal_plan_generation"."status" = 'pending';