import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private users: UsersService, private jwt: JwtService) {}

    async register(email: string, password: string, name?: string) {
        const hash = await bcrypt.hash(password, 10);
        const user = await this.users.createUser({ email, name, passwordHash: hash });
        const token = await this.sign(user.id, user.email);
        return { accessToken: token, user: { id: user.id, email: user.email, name: user.name } };
    }

    async login(email: string, password: string) {
        const user = await this.users.findByEmail(email);
        if (!user) throw new UnauthorizedException('Invalid credentials');
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) throw new UnauthorizedException('Invalid credentials');
        const token = await this.sign(user.id, user.email);
        return { accessToken: token, user: { id: user.id, email: user.email, name: user.name } };
    }

    async sign(sub: number, email: string) {
        return this.jwt.signAsync({ sub, email });
    }
}
