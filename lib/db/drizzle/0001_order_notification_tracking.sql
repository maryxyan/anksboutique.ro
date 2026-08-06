ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "confirmation_email_sent_at" timestamp;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "admin_notification_sent_at" timestamp;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "failed_payment_email_sent_at" timestamp;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cancelled_payment_email_sent_at" timestamp;
