import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "./config/configuration";
import { DrizzleModule } from "./db/drizzle.module";
import { HealthModule } from "./health/health.module";
import { LocationsModule } from "./locations/locations.module";
import { ItemsModule } from "./items/items.module";
import { StockModule } from "./stock/stock.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DrizzleModule,
    HealthModule,
    LocationsModule,
    ItemsModule,
    StockModule,
  ],
})
export class AppModule {}
