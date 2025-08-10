import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
    appController = app.get<AppController>(AppController);
  });

  it('should return API info', () => {
    const res = appController.getApiInfo();
    expect(res.message).toBe('Job Matcher API');
    expect(res).toHaveProperty('status', 'running');
  });
});
