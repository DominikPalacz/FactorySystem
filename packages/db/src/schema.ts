import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  check,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const locations = pgTable("locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull().default("shelf"),
  capacity: integer("capacity"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  sku: text("sku").notNull().unique(),
  description: text("description"),
  uom: text("uom").notNull().default("pcs"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventoryBalance = pgTable(
  "inventory_balance",
  {
    locationId: uuid("location_id")
      .references(() => locations.id)
      .notNull(),
    itemId: uuid("item_id")
      .references(() => items.id)
      .notNull(),
    quantity: integer("quantity").notNull().default(0),
    lastUpdated: timestamp("last_updated").defaultNow(),
  },
  (t) => ({
    pk: uniqueIndex("pk_inventory_balance").on(t.locationId, t.itemId),
    positiveStock: check("positive_stock_check", sql`${t.quantity} >= 0`),
  }),
);

export const inventoryLedger = pgTable(
  "inventory_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    transactionGroupId: uuid("transaction_group_id").notNull(),
    itemId: uuid("item_id")
      .references(() => items.id)
      .notNull(),
    locationId: uuid("location_id")
      .references(() => locations.id)
      .notNull(),
    quantityChange: integer("quantity_change").notNull(),
    referenceType: text("reference_type").notNull(),
    operatorId: text("operator_id").notNull(),
    timestamp: timestamp("timestamp").defaultNow(),
    metadata: jsonb("metadata"),
  },
  (t) => ({
    itemIdx: index("ledger_item_idx").on(t.itemId),
    locationIdx: index("ledger_location_idx").on(t.locationId),
    timeIdx: index("ledger_time_idx").on(t.timestamp),
    transactionGroupIdx: index("ledger_tx_group_idx").on(t.transactionGroupId),
  }),
);

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    status: text("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    statusIdx: index("outbox_status_idx").on(t.status),
    createdIdx: index("outbox_created_idx").on(t.createdAt),
  }),
);

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow(),
    lastUsedAt: timestamp("last_used_at").defaultNow(),
    responseHash: text("response_hash"),
    responseBody: jsonb("response_body"),
  },
  (t) => ({
    keyIdx: index("idempotency_key_idx").on(t.key),
  }),
);
