import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { UsersService } from '../users/users.service';
import { UsersModule } from '../users/users.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { XmtpModule } from '../xmtp/xmtp.module';
import { XmtpService } from '../xmtp/xmtp.service';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UsersModule,
    XmtpModule,
    WalletsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, UsersService, XmtpService],
  exports: [BookingsService],
})
export class BookingsModule {}
