import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AuthService } from './auth/auth.service';
import { XmtpService } from './xmtp/xmtp.service';
import { UsersService } from './users/users.service';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: XmtpService, useValue: {} },
        { provide: UsersService, useValue: {} },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
