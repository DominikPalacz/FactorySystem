import * as path from "path";
import * as dotenv from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { inventoryBalance, items, locations } from "./schema";

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://admin:password@localhost:5432/factory_db";

async function main() {
  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  const [locA, locB, dock] = [
    { name: "A-01-01", type: "shelf", capacity: 100 },
    { name: "B-02-05", type: "shelf", capacity: 120 },
    { name: "Dock-1", type: "dock", capacity: 500 },
  ];

  const [skuBolt, skuSheet, skuPanel] = [
    { sku: "SKU-BOLT-M8", description: "Bolt M8", uom: "pcs" },
    { sku: "SKU-SHEET-4x8", description: "Steel sheet 4x8", uom: "pcs" },
    { sku: "SKU-PANEL", description: "Panel assembly", uom: "pcs" },
  ];

  await db.insert(locations).values([locA, locB, dock]).onConflictDoNothing();
  await db.insert(items).values([skuBolt, skuSheet, skuPanel]).onConflictDoNothing();

  // Preload some stock into Dock and Shelf
  const [{ id: dockId }] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(eq(locations.name, "Dock-1"))
    .limit(1);

  const [{ id: shelfAId }] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(eq(locations.name, "A-01-01"))
    .limit(1);

  const [{ id: boltId }] = await db
    .select({ id: items.id })
    .from(items)
    .where(eq(items.sku, "SKU-BOLT-M8"))
    .limit(1);

  await db
    .insert(inventoryBalance)
    .values([
      { locationId: dockId, itemId: boltId, quantity: 200 },
      { locationId: shelfAId, itemId: boltId, quantity: 40 },
    ])
    .onConflictDoNothing();

  await pool.end();
  console.log("Seed completed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
