import { Controller, Get, Inject } from "@nestjs/common";

import { UsersService } from "../infrastructure/users.service";

@Controller("users")
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
