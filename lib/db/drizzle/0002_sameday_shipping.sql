ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_method" text DEFAULT 'home' NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sameday_ooh_id" integer;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sameday_ooh_name" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sameday_ooh_address" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sameday_awb_number" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sameday_awb_cost" numeric(10, 2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sameday_awb_pdf_url" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sameday_awb_created_at" timestamp;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_sameday_awb_number_unique" ON "orders" ("sameday_awb_number") WHERE "sameday_awb_number" IS NOT NULL;
