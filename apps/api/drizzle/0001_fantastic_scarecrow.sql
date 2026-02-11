CREATE TABLE "workflow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nodes_json" jsonb,
	"title" text,
	"description" text,
	"tables_involved" text[],
	"result" text,
	"ui_type" text,
	"ui_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "full_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_email_unique" UNIQUE("email");