CREATE TABLE "ai_call_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"status" text NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"latency_ms" integer NOT NULL,
	"error_code" text,
	"error_message" text,
	"user_id" uuid,
	"budget_plan_id" uuid,
	"generation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ai_call_log_created_at_idx" ON "ai_call_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_call_log_operation_idx" ON "ai_call_log" USING btree ("operation","created_at");--> statement-breakpoint
CREATE INDEX "ai_call_log_generation_idx" ON "ai_call_log" USING btree ("generation_id");