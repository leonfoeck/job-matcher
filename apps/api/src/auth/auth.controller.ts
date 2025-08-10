import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthResponse, RequestWithUser } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(body.email, body.password, body.name);
  }

  // Passport Local reads credentials from req.body; DTO ensures validation runs.
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Request() req: RequestWithUser, // populated by LocalStrategy
    // Keep this param so class-validator runs; it won’t be used directly:
    @Body() _body: LoginDto,
  ): Promise<AuthResponse> {
    return this.authService.login(req.user);
  }
}
