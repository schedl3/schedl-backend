import { Controller, Get, Param } from '@nestjs/common';
import { TokenPaymentService } from './token-payment.service';

@Controller('token-payment')
export class TokenPaymentController {
constructor(private readonly tokenPaymentService: TokenPaymentService) {}

  @Get('balance/:address')
  async getTokenBalance(@Param('address') address: string): Promise<{ balance: number }> {
    const balance = await this.tokenPaymentService.getTokenBalance(address);
    return { balance };
  }
}
