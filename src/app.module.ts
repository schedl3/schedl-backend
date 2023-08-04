import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsModule } from './bookings/bookings.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { XmtpModule } from './xmtp/xmtp.module';
import { WalletsModule } from './wallets/wallets.module';
import { XmtpService } from './xmtp/xmtp.service';
import { AppController } from './app.controller';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/cats'),
    BookingsModule,
    AuthModule,
    UsersModule,
    XmtpModule,
    WalletsModule,
  ],
  controllers: [AppController],
  providers: [XmtpService],
})
export class AppModule {}
