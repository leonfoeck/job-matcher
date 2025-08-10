// local-auth.guard.ts
import { AuthGuard } from '@nestjs/passport';
import {
  Injectable,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './auth.dto';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const dto = plainToInstance(LoginDto, req.body);
    const errors = await validate(dto, {
      whitelist: true,
      forbidUnknownValues: false,
    });
    if (errors.length) throw new BadRequestException(errors);
    return (await super.canActivate(context)) as boolean;
  }
}
