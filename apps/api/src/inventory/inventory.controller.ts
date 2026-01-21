import { Body, Controller, Post } from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { InboundDto } from "./dto/inbound.dto";
import { TransferDto } from "./dto/transfer.dto";

@Controller("inventory")
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Post("inbound")
  receive(@Body() dto: InboundDto) {
    return this.service.receive(dto);
  }

  @Post("transfer")
  transfer(@Body() dto: TransferDto) {
    return this.service.transfer(dto);
  }
}
