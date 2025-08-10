import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UpdateProfileDto } from './users.dto';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/types';

type RequestWithJwt = Request & { user: JwtPayload };

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@Req() req: RequestWithJwt) {
    return this.users.getMe(req.user.sub);
  }

  @Put('me/profile')
  updateProfile(@Req() req: RequestWithJwt, @Body() body: UpdateProfileDto) {
    return this.users.upsertProfile(req.user.sub, body);
  }
}
