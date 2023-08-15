import { Test, TestingModule } from '@nestjs/testing';
import { TokenPaymentService } from './token-payment.service';

describe('TokenPaymentService', () => {
  let service: TokenPaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenPaymentService],
    }).compile();

    service = module.get<TokenPaymentService>(TokenPaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
