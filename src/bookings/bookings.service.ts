import { DateTime } from 'luxon';
import { Injectable } from '@nestjs/common';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking } from './schemas/booking.schema';
import { User, Schedule } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';


function isMeetingScheduled(
  schedule: Schedule,
  meetingTimestamp: number,
  lengthMinutes: number,
  timezone?: string
): boolean {
  // Check if length minutes is valid (15, 30, or 60 minutes)
  if (![15, 30, 60].includes(lengthMinutes)) {
    throw new Error("Invalid length minutes. Please provide 15, 30, or 60 minutes.");
  }

  // Convert meeting timestamp to the specified timezone (or use UTC if timezone is not provided)
  const meetingDateTime = timezone
    ? DateTime.fromMillis(meetingTimestamp, { zone: timezone })
    : DateTime.fromMillis(meetingTimestamp, { zone: 'utc' });

  // Check if meeting timestamp's minutes modulo length minutes is 0
  if (meetingDateTime.minute % lengthMinutes !== 0) {
    return false;
  }

  const meetingDate = meetingDateTime.toFormat('yyyy-MM-dd');

  // Get the day of the week for the meeting in the specified timezone
  const meetingDay = meetingDateTime.toFormat('EEE');

  console.log(meetingDateTime.toFormat('EEEE, LLLL dd, yyyy, hh:mm a'));

  // Check if the meeting timestamp is within one of the intervals scheduled for that day of the week
  if (schedule[meetingDay]) {
    const intervals = schedule[meetingDay].split(",");
    for (const interval of intervals) {
      const [startTime, endTime] = interval.split("-").map((time) => {
        const [h, m] = time.split(':');
        const fullTime = h.padStart(2, '0') + ':' + (m === undefined ? '00' : m);
        const tstamp = DateTime.fromFormat(meetingDate + ' ' + fullTime, 'yyyy-MM-dd HH:mm');
        const readableDate = tstamp.toFormat('EEEE, LLLL dd, yyyy, hh:mm a');
        console.log(readableDate);
        return tstamp.toMillis()
      });
      console.log(startTime, endTime, meetingTimestamp, lengthMinutes * 60000);
      if (meetingTimestamp >= startTime && meetingTimestamp + lengthMinutes * 60000 <= endTime) {
        return true;
      }
    }
  }

  return false;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private readonly BookingModel: Model<Booking>,
    // make the users service available to the bookings service:
    private readonly usersService: UsersService,

    ) { }

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

    // check start time is in schedule
    // convert a time string like 2023-07-30T08:00:00.000Z into a timestamp
    const meetingTimestamp = Date.parse(body.start);
    const lengthMinutes = body.minutes;
    const timezone = body.timezone ? body.timezone : ''; // UTC by default?
    const isScheduled = isMeetingScheduled(toUser.schedule, meetingTimestamp, lengthMinutes, timezone);
    if (!isScheduled) {
      throw new Error("Meeting time is not in schedule");
    }

    return `Hello, ${user.username}! You requested ${toUser.username}`;
  }
}
