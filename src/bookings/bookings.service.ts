import { DateTime, Interval } from 'luxon';
import { Injectable } from '@nestjs/common';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking } from './schemas/booking.schema';
import { Schedule } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';

// Given a day and a time return the number of hours from the beginning of the week.
function getOffsetFromBeginningOfWeek(day: string, hhmm: string) {
  // XXX luxon week starts Monday
  const dayIdx = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  // t0 is 00:00 today, t1 is the time X days from now
  const t0 = DateTime.fromFormat('00:00', 'HH:mm');
  const t1 = DateTime.fromFormat(hhmm, 'HH:mm').plus({ days: dayIdx[day] });
  const offsetInHrs = Interval.fromDateTimes(t0, t1).length('hours');
  return offsetInHrs;
}

// [
//   { start: 148, end: 167.5 },
//   { start: 4, end: 23.5 },
//   { start: 33, end: 41.5 },
//   { start: 57, end: 65.5 },
//   { start: 81, end: 89.5 },
//   { start: 105, end: 113.5 },
//   { start: 129, end: 131.5 }
// ]
function getStartEndTimes(schedule: Schedule) {
  const weekDays = Object.keys(schedule);
  const startEndTimesPerDay = {};

  weekDays.forEach((day) => {
    const intervals = schedule[day].split(",");
    const startEndTimes = intervals.map((interval) => {
      const [startTime, endTime] = interval.split("-").map((time) => {
        const [h, m] = time.split(':');
        const hhmm = h.padStart(2, '0') + ':' + (m === undefined ? '00' : m);
        const offsetStart = getOffsetFromBeginningOfWeek(day, hhmm);
        return offsetStart;
      });
      return { start: startTime, end: endTime };
    });

    startEndTimesPerDay[day] = startEndTimes;
  });

  return [].concat(...Object.values(startEndTimesPerDay));
  // return startEndTimesPerDay;
}

function getOffsetFromUTC(tz) {
  const dt = DateTime.utc().setZone(tz);
  return dt.offset / 60;
}

// convert from non-utc to utc to all the available hour intervals during a 168 hour week
function normalizeTzOffset(times, offset) {
  const hoursInWeek = 24 * 7;
  return times.map(({ start, end }) => ({
    start: start - offset,
    end: end - offset,
  })).flatMap(({ start, end }) => {
    if (start < 0 && end < 0) {
      return [{ start: start + hoursInWeek, end: end + hoursInWeek }];
    } else if (start > hoursInWeek && end > hoursInWeek) {
      return [{ start: start - hoursInWeek, end: end - hoursInWeek }];
    } else if (start < 0) {
      return [[{ start: start + hoursInWeek, end: hoursInWeek }], [{ start: 0, end: end }]];
    } else if (end > hoursInWeek) {
      return [[{ start: start, end: hoursInWeek }], [{ start: 0, end: end - hoursInWeek }]];
    }
    return [[{ start, end }]];
  });
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

    const meetingDateTime = DateTime.fromISO(body.start, { zone: 'utc' });
    const lengthMinutes = body.minutes;
    if (![15, 30, 60].includes(lengthMinutes)) {
      throw new Error("Invalid length in minutes. Please provide 15, 30, or 60 minutes.");
    }
    // The minute the meeting starts should be a multiple of the period
    if (meetingDateTime.minute % lengthMinutes !== 0) {
      throw new Error("Invalid meeting start time.");
    }
    const tz = toUser.tz ? toUser.tz : 'utc';
    const off = getOffsetFromUTC(tz);
    let times = getStartEndTimes(toUser.schedule);
    console.log(times);

    times = normalizeTzOffset(times, off);
    console.log(times);
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
    return `Hello, ${user.username}! You requested ${toUser.username}`;
  }
}
