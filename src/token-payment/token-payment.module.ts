import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TokenPaymentService } from './token-payment.service';
import { TokenPaymentController } from './token-payment.controller';

@Module({
  imports: [HttpModule],
  providers: [TokenPaymentService],
  controllers: [TokenPaymentController]
})
export class TokenPaymentModule {}
