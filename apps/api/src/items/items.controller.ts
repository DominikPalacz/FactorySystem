import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ItemsService } from "./items.service";
import { CreateItemDto } from "./dto/create-item.dto";

@Controller("items")
export class ItemsController {
  constructor(private readonly service: ItemsService) {}

  @Get()
  list() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateItemDto) {
    return this.service.create(dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.removeById(id);
  }
}
