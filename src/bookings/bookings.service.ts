import { DateTime } from 'luxon';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking } from './schemas/booking.schema';
import { UsersService } from '../users/users.service';
import { XmtpService } from '../xmtp/xmtp.service';
import { toWeekHourRanges, getOffsetFromUTC, offsetScheduleRanges} from './bookings.utils'

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private readonly BookingModel: Model<Booking>,
    private usersService: UsersService,
    private xmtpService: XmtpService,
  ) {}
  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const createdBooking = await this.BookingModel.create(createBookingDto);
    return createdBooking;
  }

  async findAll(): Promise<Booking[]> {
    return this.BookingModel.find().exec();
  }

  async findOne(id: string): Promise<Booking> {
    return this.BookingModel.findOne({ _id: id }).exec();
  }

  async findByFromAddress(fromAddress: string): Promise<Booking[]> {
    return this.BookingModel.find({ fromAddress }).exec();
  }

  async findByToUsername(toUsername: string): Promise<Booking[]> {
    return this.BookingModel.find({ toUsername }).exec();
  }

  async delete(id: string) {
    const deletedBooking = await this.BookingModel
      .findByIdAndRemove({ _id: id })
      .exec();
    return deletedBooking;
  }

  async makeRequest(fromUser: any, requestBody: any): Promise<string> {
    const user = fromUser;
    const body = requestBody;
    const toUser = await this.usersService.findOneUsername(body.toUsername);
    console.log(user);
    console.log(toUser);
    if (!toUser) {
      throw new Error("User does not exist");
    }

    const meetingDateTime = DateTime.fromISO(body.start, { zone: 'utc' });
    const lengthMinutes = body.minutes;
    if (![15, 30, 60].includes(lengthMinutes)) {
      throw new Error("Invalid length in minutes. Please provide 15, 30, or 60 minutes.");
    }
    // The minute the meeting starts should be a multiple of the period
    if (meetingDateTime.minute % lengthMinutes !== 0) {
      throw new Error("Invalid meeting start time.");
    }
    let times = toWeekHourRanges(toUser.schedule);
    console.log('orig:', times);
    const tz = toUser.tz ? toUser.tz : 'utc';
    const off = getOffsetFromUTC(tz);
    times = offsetScheduleRanges(times, off);
    console.log('norm:', times);
    // Calculate the start time and end time of the meeting in the week
    const beginningOfWeek = meetingDateTime.startOf('week');
    const startMeet = meetingDateTime.diff(beginningOfWeek, 'minutes').minutes / 60;
    const endMeet = startMeet + lengthMinutes / 60;
    if (times.some(([{ start, end }]) => start <= startMeet && end >= endMeet)) {
      // return `Hello, ${user.username}! You requested ${toUser.username}`;
    } else {
      throw new Error("Meeting time is not in schedule");
    }

    const booking: CreateBookingDto = {
      status: 'initial',
      fromAddress: user.idAddress,
      toUsername: toUser.username,
      start: meetingDateTime.toISO(),
      minutes: lengthMinutes,
      msg: body.msg,
    }
    const createdBooking = await this.BookingModel.create(booking);
    const updateStatusToConfirmed = async (newStatus: string) => {
      if (newStatus !== 'confirmed' && newStatus !== 'rejected') {
        throw new Error(`Invalid status: ${newStatus}`);
      }
      try {
        createdBooking.status = newStatus;
        await createdBooking.save();
        console.log(`Booking with ID ${createdBooking._id} status updated to ${newStatus}.`);
        this.xmtpService.sendMessage(`Booking status updated to ${newStatus}.`, user.assistantXmtpAddress);
      } catch (error) {
        console.error(`Error updating booking status: ${error}`);
      }
    }
    // TODO sanitize xmtp message
    this.xmtpService.sendMessageAwaitConfirmation(body.msg, toUser.idAddress, updateStatusToConfirmed);
    return `Hello, ${user.username}! You requested ${toUser.username}. Check status at /bookings/${createdBooking._id}`;
  }
}
