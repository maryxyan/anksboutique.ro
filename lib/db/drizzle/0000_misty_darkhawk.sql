CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"compare_price" numeric(10, 2),
	"images" text[] DEFAULT '{}' NOT NULL,
	"color_images" jsonb DEFAULT '{}'::jsonb,
	"category_id" integer NOT NULL,
	"sizes" text[] DEFAULT '{}' NOT NULL,
	"colors" text[] DEFAULT '{}' NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"badge" text,
	"sku" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"size" text,
	"color" text,
	"price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"product_title" text NOT NULL,
	"product_image" text,
	"price" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"size" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text NOT NULL,
	"shipping_address" text,
	"city" text,
	"county" text,
	"postal_code" text,
	"notes" text,
	"total" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"netopia_order_id" text,
	"session_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"product_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"reviewer_name" text NOT NULL,
	"reviewer_email" text,
	"rating" integer NOT NULL,
	"comment" text,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscriptions_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text NOT NULL,
	"order_number" text NOT NULL,
	"order_date" text NOT NULL,
	"products" jsonb NOT NULL,
	"return_option" text DEFAULT 'refund' NOT NULL,
	"replacement_size" text,
	"replacement_color" text,
	"account_holder" text,
	"iban" text,
	"bank" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "labels_slug_unique" UNIQUE("slug")
);
