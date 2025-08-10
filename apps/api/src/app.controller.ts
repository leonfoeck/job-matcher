import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getApiInfo() {
    return {
      message: 'Job Matcher API',
      endpoints: {
        jobs: '/jobs',
        // Add more endpoints here as they're created
      },
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }
}
