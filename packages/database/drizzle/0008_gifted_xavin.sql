ALTER TABLE "restaurant" DROP CONSTRAINT "restaurant_external_id_unique";--> statement-breakpoint
ALTER TABLE "restaurant" ALTER COLUMN "external_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "source" text DEFAULT 'foodpanda' NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurant_recommendation" ADD COLUMN "items" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_external_id_unique" ON "restaurant" USING btree ("external_id") WHERE "restaurant"."external_id" is not null;