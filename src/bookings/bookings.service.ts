import { DateTime, Interval } from 'luxon';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking } from './schemas/booking.schema';
import { Schedule } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { XmtpService } from '../xmtp/xmtp.service';

type ScheduleCSVByDay = Schedule;

type WeekHour = number & { __weekHoursBrand: never };
type Partial24hTime = string & { __partial24hTimeBrand: never };

const validateWeekHour = (value: number): WeekHour => {
  if (value < 0 || value > 24*7) {
    throw new Error('WeekHour must be between 0 and 168.');
  }
  return value as WeekHour;
};

const validatePartial24hTime = (value: string): Partial24hTime => {
  // Regular expression to match 24-hour time format
  const regex = /^(?:2[0-3]|[01]?[0-9])(?::([0-5]?[0-9]))?$/;

  if (!regex.test(value)) {
    throw new Error('Invalid partial 24-hour time format. Use HH or HH:mm format.');
  }

  return value as Partial24hTime;
};

const toIsoHHmm = (p24HTime: Partial24hTime): string => {
  const [HH, mm] = p24HTime.split(':');
  const isoHHmm = HH.padStart(2, '0') + ':' + (mm === undefined ? '00' : mm);
  return isoHHmm;
}

interface WeekHourRange {
  start: WeekHour;
  end: WeekHour;
}

const validateWeekHourRange = ({start, end}) => {
  validateWeekHour(start);
  validateWeekHour(end);
  return { start, end } as WeekHourRange;
}

// Given a day and a time return the number of hours from the beginning of the week.
function toWeekHour(day: string, isoHHmm: string): WeekHour {
  // XXX luxon week starts Monday
  const dayIdx = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  // t0 is 00:00 today, t1 is the time X days from now
  const t0 = DateTime.fromFormat('00:00', 'HH:mm');
  const t1 = DateTime.fromFormat(isoHHmm, 'HH:mm').plus({ days: dayIdx[day] });
  const wh = validateWeekHour(Interval.fromDateTimes(t0, t1).length('hours'));
  return wh;
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
function toWeekHourRanges(schedule: ScheduleCSVByDay) {
  const weekDays = Object.keys(schedule);
  const rangesByDay = {};

  weekDays.forEach((day) => {
    const csv = schedule[day];
    rangesByDay[day] = csv.split(",").map((partialRange) => {
      const [start, end] = partialRange.split("-").map((s) => {
        const p24HTime = validatePartial24hTime(s);
        return toWeekHour(day, toIsoHHmm(p24HTime));
      });
      return { start, end } as WeekHourRange;
    });
  });

  return [].concat(...Object.values(rangesByDay));
}

function getOffsetFromUTC(tz) {
  const dt = DateTime.utc().setZone(tz);
  return dt.offset / 60;
}

// convert from non-utc to utc to all the available hour ranges during a 168 hour week
function normalizeTzOffset(ranges: Array<WeekHourRange>, offset) {
  const hoursInWeek = 24 * 7;
  return ranges.map(({ start, end }) => ({
    start: start - offset,
    end: end - offset,
  } as WeekHourRange)).flatMap(({ start, end }: WeekHourRange): Array<WeekHourRange> => {
    if (start < 0 && end < 0) {
      return [validateWeekHourRange({ start: start + hoursInWeek, end: end + hoursInWeek })];
    } else if (start > hoursInWeek && end > hoursInWeek) {
      return [validateWeekHourRange({ start: start - hoursInWeek, end: end - hoursInWeek })];
    } else if (start < 0) {
      return [validateWeekHourRange({ start: start + hoursInWeek, end: hoursInWeek }), validateWeekHourRange({ start: 0, end: end })];
    } else if (end > hoursInWeek) {
      return [validateWeekHourRange({ start: start, end: hoursInWeek }), validateWeekHourRange({ start: 0, end: end - hoursInWeek })];
    }
    return [validateWeekHourRange({ start, end })];
  });
}

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
    times = normalizeTzOffset(times, off);
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
