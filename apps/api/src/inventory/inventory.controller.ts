import { Body, Controller, Post, UseInterceptors } from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { InboundDto } from "./dto/inbound.dto";
import { TransferDto } from "./dto/transfer.dto";
import { IdempotencyInterceptor } from "../idempotency/idempotency.interceptor";

@Controller("inventory")
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Post("inbound")
  @UseInterceptors(IdempotencyInterceptor)
  receive(@Body() dto: InboundDto) {
    return this.service.receive(dto);
  }

  @Post("transfer")
  @UseInterceptors(IdempotencyInterceptor)
  transfer(@Body() dto: TransferDto) {
    return this.service.transfer(dto);
  }
}
