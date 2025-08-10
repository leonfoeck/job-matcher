import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') return; // skip in Tests
    await this.$connect();
  }

  async onModuleDestroy() {
    if (process.env.NODE_ENV === 'test') return; // skip in Tests
    await this.$disconnect();
  }
}
