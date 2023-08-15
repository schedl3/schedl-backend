import { Test, TestingModule } from '@nestjs/testing';
import { TokenPaymentController } from './token-payment.controller';

describe('TokenPaymentController', () => {
  let controller: TokenPaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokenPaymentController],
    }).compile();

    controller = module.get<TokenPaymentController>(TokenPaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
