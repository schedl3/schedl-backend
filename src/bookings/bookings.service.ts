import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBookingDto } from './dto/create-booking.dto';
import { booking } from './schemas/booking.schema';

@Injectable()
export class BookingsService {
  constructor(@InjectModel(booking.name) private readonly BookingModel: Model<booking>) {}

  async create(createBookingDto: CreateBookingDto): Promise<booking> {
    const createdBooking = await this.BookingModel.create(createBookingDto);
    return createdBooking;
  }

  async findAll(): Promise<booking[]> {
    return this.BookingModel.find().exec();
  }

  async findOne(id: string): Promise<booking> {
    return this.BookingModel.findOne({ _id: id }).exec();
  }

  async delete(id: string) {
    const deletedBooking = await this.BookingModel
      .findByIdAndRemove({ _id: id })
      .exec();
    return deletedBooking;
  }
}
