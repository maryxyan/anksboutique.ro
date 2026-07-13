import { pgTable, serial, text, numeric, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const returnsTable = pgTable("returns", {
  id: serial("id").primaryKey(),
  // Client info
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  // Order info
  orderNumber: text("order_number").notNull(),
  orderDate: text("order_date").notNull(),
  // Products (JSON array of { name, sku, quantity, reason })
  products: jsonb("products").notNull(),
  // Refund option: "replace" or "refund"
  returnOption: text("return_option").notNull().default("refund"),
  // Replacement details
  replacementSize: text("replacement_size"),
  replacementColor: text("replacement_color"),
  // Refund details
  accountHolder: text("account_holder"),
  iban: text("iban"),
  bank: text("bank"),
  // Status
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReturnSchema = createInsertSchema(returnsTable).omit({ id: true, createdAt: true, status: true });
export type InsertReturn = z.infer<typeof insertReturnSchema>;
export type Return = typeof returnsTable.$inferSelect;
