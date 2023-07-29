import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { booking } from './schemas/booking.schema';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly BookingsService: BookingsService) {}

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto) {
    await this.BookingsService.create(createBookingDto);
  }

  @Get()
  async findAll(): Promise<booking[]> {
    return this.BookingsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<booking> {
    return this.BookingsService.findOne(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.BookingsService.delete(id);
  }
}
