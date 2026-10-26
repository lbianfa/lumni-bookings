import { Controller, Get } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";

// Scaffold root route; left out of the API docs.
@Controller()
@ApiExcludeController()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: "hello from create-prisma + nest",
    };
  }
}
