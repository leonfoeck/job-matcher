import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
    constructor(private auth: AuthService, private users: UsersService) {}

    @Post('register')
    register(@Body() body: any) {
        return this.auth.register(String(body.email), String(body.password), body.name ? String(body.name) : undefined);
    }

    @Post('login')
    login(@Body() body: any) {
        return this.auth.login(String(body.email), String(body.password));
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async me(@Req() req: any) {
        const userId = req.user.sub as number;
        const full = await this.users.getMe(userId);
        return full;
    }
}
