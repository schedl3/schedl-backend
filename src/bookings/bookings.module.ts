import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { booking, BookingSchema } from './schemas/booking.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: booking.name, schema: BookingSchema }])],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
