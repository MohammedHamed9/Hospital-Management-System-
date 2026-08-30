import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/users/user-schema';

@Controller('doctors')
export class DoctorsController {
  @UseGuards(AuthGuard())
  @Get()
  justTest(@Request() req): User {
    return req.user;
  }
}
