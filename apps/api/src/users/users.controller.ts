import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@Req() req: any) {
    return this.users.getMe(req.user.sub);
  }

  @Put('me/profile')
  updateProfile(@Req() req: any, @Body() body: any) {
    return this.users.upsertProfile(req.user.sub, body);
  }
}
