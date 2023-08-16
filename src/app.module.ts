import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsModule } from './bookings/bookings.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { XmtpModule } from './xmtp/xmtp.module';
import { WalletsModule } from './wallets/wallets.module';
import { XmtpService } from './xmtp/xmtp.service';
import { AppController } from './app.controller';
import { TokenPaymentModule } from './token-payment/token-payment.module';

const rootPath = process.env.NEXT_OUT_DIR;

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/cats'),
    ServeStaticModule.forRoot({ rootPath }),
    BookingsModule,
    AuthModule,
    UsersModule,
    XmtpModule,
    WalletsModule,
    TokenPaymentModule,
  ],
  controllers: [AppController],
  providers: [XmtpService],
})
export class AppModule {}
