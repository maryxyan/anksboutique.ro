ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_method" text DEFAULT 'home' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sameday_ooh_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sameday_ooh_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sameday_ooh_address" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sameday_awb_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sameday_awb_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sameday_awb_pdf_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sameday_awb_created_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "confirmation_email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "admin_notification_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "failed_payment_email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cancelled_payment_email_sent_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_sameday_awb_number_unique" ON "orders" USING btree ("sameday_awb_number") WHERE "orders"."sameday_awb_number" is not null;
