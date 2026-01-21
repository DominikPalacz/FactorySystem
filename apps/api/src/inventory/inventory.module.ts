import { Module } from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { InventoryController } from "./inventory.controller";
import { IdempotencyInterceptor } from "../idempotency/idempotency.interceptor";

@Module({
  providers: [InventoryService, IdempotencyInterceptor],
  controllers: [InventoryController],
  exports: [InventoryService],
})
export class InventoryModule {}
