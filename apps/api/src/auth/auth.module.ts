import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    // Falls du Config bereits im AppModule global aufrufst, diese Zeile hier entfernen.
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error(
            'JWT_SECRET missing – set it in your environment (.env)',
          );
        }
        return {
          secret,
          signOptions: { expiresIn: '7d' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    UsersService,
    PrismaService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
