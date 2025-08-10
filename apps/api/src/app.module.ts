import { Module } from '@nestjs/common';
import { JobsModule } from './jobs/jobs.module';
import { IngestModule } from './ingest/ingest.module'; // ⬅️ add this
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
// Keep these if you still have them:
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [JobsModule, IngestModule, AuthModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
