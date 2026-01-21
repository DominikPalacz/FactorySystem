import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DRIZZLE } from "../db/drizzle.module";
import { locations } from "@factory/db/schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@factory/db/schema";
import { CreateLocationDto } from "./dto/create-location.dto";

@Injectable()
export class LocationsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db.select().from(locations).orderBy(locations.name);
  }

  async create(dto: CreateLocationDto) {
    const [created] = await this.db
      .insert(locations)
      .values({
        name: dto.name,
        type: dto.type,
        capacity: dto.capacity,
      })
      .returning();
    return created;
  }

  async removeById(id: string) {
    await this.db.delete(locations).where(eq(locations.id, id));
    return { ok: true };
  }
}
