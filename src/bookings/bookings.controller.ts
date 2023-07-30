import { DateTime } from 'luxon';
import { Body, Controller, Delete, Get, Param, Post, UseGuards, Request, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CustomAuthGuard } from '../auth/auth.guard';
import { BookingsService } from './bookings.service';
import { UsersService } from '../users/users.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking } from './schemas/booking.schema';
import { Schedule } from '../users/schemas/user.schema';

@Injectable()
export class SuperUserGuard extends CustomAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // call CustomAuthGuard in order to ensure user is injected in request
    const baseGuardResult = await super.canActivate(context);
    if (!baseGuardResult) {
      // unsuccessful authentication return false
      return false;
    }
    // Perform any custom logic to check if the user is the desired one
    const request = context.switchToHttp().getRequest();
    const user = request.user; // This will be the user object returned from Passport's JwtStrategy
    console.log(user);

    // if (user && user.idAddress === '0x78a74b5D1A86704c573163C3aafB6e7234c9Da1e') {
    //   return true;
    // }
    // XXX username missing unless extending CustomAuthGuard
    const requiredUserId = 'superuser';
    if (user && user.username === requiredUserId) {
      return true;
    }

    return false;
  }
}

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

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly usersService: UsersService,
  ) { }

  @UseGuards(SuperUserGuard)
  @Post()
  async create(@Body() createBookingDto: CreateBookingDto) {
    await this.bookingsService.create(createBookingDto);
  }

  @UseGuards(SuperUserGuard)
  @Get()
  async findAll(): Promise<Booking[]> {
    return this.bookingsService.findAll();
  }

  @UseGuards(SuperUserGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Booking> {
    return this.bookingsService.findOne(id);
  }

  @UseGuards(SuperUserGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.bookingsService.delete(id);
  }

  @Post('request')
  @UseGuards(CustomAuthGuard)
  async makeRequest(@Request() req) {
    const user = req.user;
    const body = req.body;
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
