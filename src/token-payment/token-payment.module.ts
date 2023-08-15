import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TokenPaymentService } from './token-payment.service';
import { TokenPaymentController } from './token-payment.controller';

@Module({
  imports: [
    UsersModule,
  ],
  providers: [TokenPaymentService],
  controllers: [TokenPaymentController]
})
export class TokenPaymentModule {}
