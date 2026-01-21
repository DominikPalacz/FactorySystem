import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { LocationsService } from "./locations.service";
import { CreateLocationDto } from "./dto/create-location.dto";

@Controller("locations")
export class LocationsController {
  constructor(private readonly service: LocationsService) {}

  @Get()
  list() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateLocationDto) {
    return this.service.create(dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.removeById(id);
  }
}
