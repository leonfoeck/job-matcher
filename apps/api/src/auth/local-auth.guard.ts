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

// optional: Typ der Express-Request nutzen
type ReqWithBody = { body: unknown };

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<ReqWithBody>(); // <-- kein any mehr
    const dto = plainToInstance(LoginDto, req.body); // body ist unknown, safe
    const errors = await validate(dto, {
      whitelist: true,
      forbidUnknownValues: false,
    });
    if (errors.length) throw new BadRequestException(errors);

    return (await super.canActivate(context)) as boolean;
  }
}
