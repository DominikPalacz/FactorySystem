import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DRIZZLE } from "../db/drizzle.module";
import { items } from "@factory/db/schema";
import { CreateItemDto } from "./dto/create-item.dto";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@factory/db/schema";

@Injectable()
export class ItemsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db.select().from(items).orderBy(items.sku);
  }

  async create(dto: CreateItemDto) {
    const [created] = await this.db
      .insert(items)
      .values({
        sku: dto.sku,
        description: dto.description,
        uom: dto.uom ?? "pcs",
      })
      .returning();
    return created;
  }

  async removeById(id: string) {
    await this.db.delete(items).where(eq(items.id, id));
    return { ok: true };
  }
}
