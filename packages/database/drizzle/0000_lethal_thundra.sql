CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"first_name" text,
	"last_name" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"delivery_fee" numeric(10, 2),
	"minimum_order" numeric(10, 2),
	"rating" numeric(3, 2),
	"rating_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "restaurants_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_type" text NOT NULL,
	"total_budget" numeric(12, 2) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"meals_per_day" integer NOT NULL,
	"notification_times" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budget_plans_notification_times_length" CHECK (("budget_plans"."notification_times" IS NULL OR jsonb_array_length("budget_plans"."notification_times") = "budget_plans"."meals_per_day"))
);
--> statement-breakpoint
CREATE TABLE "meal_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meal_types_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "budget_plan_meal_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_plan_id" uuid NOT NULL,
	"meal_type_id" uuid NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_plan_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_plan_id" uuid NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generation_id" uuid NOT NULL,
	"slot_date" date NOT NULL,
	"meal_type_id" uuid NOT NULL,
	"option_index" integer NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"estimated_price" numeric(10, 2),
	"notes" text,
	CONSTRAINT "valid_option_index" CHECK ("meal_suggestions"."option_index" >= 0)
);
--> statement-breakpoint
CREATE TABLE "meal_choices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"budget_plan_id" uuid NOT NULL,
	"slot_date" date NOT NULL,
	"meal_type_id" uuid NOT NULL,
	"suggestion_id" uuid,
	"manual_description" text,
	"actual_amount_spent" numeric(10, 2) NOT NULL,
	"restaurant_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal_choice_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer,
	"liked" boolean,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_plans" ADD CONSTRAINT "budget_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_plan_meal_types" ADD CONSTRAINT "budget_plan_meal_types_budget_plan_id_budget_plans_id_fk" FOREIGN KEY ("budget_plan_id") REFERENCES "public"."budget_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_plan_meal_types" ADD CONSTRAINT "budget_plan_meal_types_meal_type_id_meal_types_id_fk" FOREIGN KEY ("meal_type_id") REFERENCES "public"."meal_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plan_generations" ADD CONSTRAINT "meal_plan_generations_budget_plan_id_budget_plans_id_fk" FOREIGN KEY ("budget_plan_id") REFERENCES "public"."budget_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_suggestions" ADD CONSTRAINT "meal_suggestions_generation_id_meal_plan_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."meal_plan_generations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_suggestions" ADD CONSTRAINT "meal_suggestions_meal_type_id_meal_types_id_fk" FOREIGN KEY ("meal_type_id") REFERENCES "public"."meal_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_suggestions" ADD CONSTRAINT "meal_suggestions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_suggestions" ADD CONSTRAINT "meal_suggestions_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_choices" ADD CONSTRAINT "meal_choices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_choices" ADD CONSTRAINT "meal_choices_budget_plan_id_budget_plans_id_fk" FOREIGN KEY ("budget_plan_id") REFERENCES "public"."budget_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_choices" ADD CONSTRAINT "meal_choices_meal_type_id_meal_types_id_fk" FOREIGN KEY ("meal_type_id") REFERENCES "public"."meal_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_choices" ADD CONSTRAINT "meal_choices_suggestion_id_meal_suggestions_id_fk" FOREIGN KEY ("suggestion_id") REFERENCES "public"."meal_suggestions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_meal_choice_id_meal_choices_id_fk" FOREIGN KEY ("meal_choice_id") REFERENCES "public"."meal_choices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_budget_plan_position" ON "budget_plan_meal_types" USING btree ("budget_plan_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_budget_plan_meal_type" ON "budget_plan_meal_types" USING btree ("budget_plan_id","meal_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_generation_slot" ON "meal_suggestions" USING btree ("generation_id","slot_date","meal_type_id","option_index");