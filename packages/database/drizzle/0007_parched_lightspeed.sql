CREATE TABLE "restaurant_recommendation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"link" text,
	"area" text,
	"note" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"created_restaurant_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "restaurant_recommendation" ADD CONSTRAINT "restaurant_recommendation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_recommendation" ADD CONSTRAINT "restaurant_recommendation_created_restaurant_id_restaurant_id_fk" FOREIGN KEY ("created_restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "restaurant_recommendation_user_status_idx" ON "restaurant_recommendation" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "restaurant_recommendation_status_created_idx" ON "restaurant_recommendation" USING btree ("status","created_at");