import { Global, Module, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@factory/db/schema";

export const PG_POOL = Symbol("PG_POOL");
export const DRIZZLE = Symbol("DRIZZLE");

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const connectionString = config.get<string>("database.url");
        return new Pool({ connectionString });
      },
    },
    {
      provide: DRIZZLE,
      inject: [PG_POOL],
      useFactory: (pool: Pool) => drizzle(pool, { schema }),
    },
  ],
  exports: [DRIZZLE, PG_POOL],
})
export class DrizzleModule implements OnModuleDestroy {
  constructor(private readonly pool: Pool) {}

  async onModuleDestroy() {
    await this.pool.end();
  }
}
