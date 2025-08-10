import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthResponse, AuthUser } from './types';

@Injectable()
export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<AuthResponse> {
    try {
      const salt = await bcrypt.genSalt(AuthService.SALT_ROUNDS);
      const hash = await bcrypt.hash(password, salt);

      const data: { email: string; passwordHash: string; name?: string } = {
        email,
        passwordHash: hash,
      };
      if (typeof name === 'string') {
        data.name = name;
      }

      const user = await this.usersService.createUser(data);

      const token = await this.sign(user.id, user.email);
      const safeUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.name,
      };

      return { accessToken: token, user: safeUser };
    } catch (error: unknown) {
      if (isPrismaUniqueViolation(error)) {
        throw new ConflictException('Email is already registered');
      }
      throw error instanceof Error
        ? error
        : new Error('Unknown error during registration');
    }
  }

  async login(user: AuthUser): Promise<AuthResponse> {
    const token = await this.sign(user.id, user.email);
    return { accessToken: token, user };
  }

  async validateUser(email: string, pass: string): Promise<AuthUser> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(pass, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return { id: user.id, email: user.email, name: user.name };
  }

  private async sign(sub: number, email: string): Promise<string> {
    return this.jwt.signAsync({ sub, email });
  }
}

// Narrow helper for Prisma unique constraint without importing Prisma types.
function isPrismaUniqueViolation(e: unknown): boolean {
  return Boolean(
    e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as { code?: string }).code === 'P2002',
  );
}
