CREATE TABLE "idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_used_at" timestamp DEFAULT now(),
	"response_hash" text,
	"response_body" jsonb,
	CONSTRAINT "idempotency_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "inventory_balance" (
	"location_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now(),
	CONSTRAINT "positive_stock_check" CHECK ("inventory_balance"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "inventory_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_group_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"quantity_change" integer NOT NULL,
	"reference_type" text NOT NULL,
	"operator_id" text NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" text NOT NULL,
	"description" text,
	"uom" text DEFAULT 'pcs' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "items_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'shelf' NOT NULL,
	"capacity" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "locations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "inventory_balance" ADD CONSTRAINT "inventory_balance_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_balance" ADD CONSTRAINT "inventory_balance_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_ledger" ADD CONSTRAINT "inventory_ledger_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_ledger" ADD CONSTRAINT "inventory_ledger_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idempotency_key_idx" ON "idempotency_keys" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "pk_inventory_balance" ON "inventory_balance" USING btree ("location_id","item_id");--> statement-breakpoint
CREATE INDEX "ledger_item_idx" ON "inventory_ledger" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "ledger_location_idx" ON "inventory_ledger" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "ledger_time_idx" ON "inventory_ledger" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "ledger_tx_group_idx" ON "inventory_ledger" USING btree ("transaction_group_id");--> statement-breakpoint
CREATE INDEX "outbox_status_idx" ON "outbox_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "outbox_created_idx" ON "outbox_events" USING btree ("created_at");