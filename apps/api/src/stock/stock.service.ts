import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { DRIZZLE } from "../db/drizzle.module";
import { inventoryBalance, items, locations } from "@factory/db/schema";
import * as schema from "@factory/db/schema";

@Injectable()
export class StockService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getStock() {
    return this.db
      .select({
        locationId: inventoryBalance.locationId,
        locationName: locations.name,
        itemId: inventoryBalance.itemId,
        itemSku: items.sku,
        quantity: inventoryBalance.quantity,
      })
      .from(inventoryBalance)
      .leftJoin(
        locations,
        eq(inventoryBalance.locationId, locations.id),
      )
      .leftJoin(items, eq(inventoryBalance.itemId, items.id))
      .orderBy(locations.name, items.sku);
  }
}
