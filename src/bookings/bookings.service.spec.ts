import { DateTime } from 'luxon';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { BookingsService } from './bookings.service';
import { Booking } from './schemas/booking.schema';
import { UsersService } from '../users/users.service';
import { User } from 'src/users/schemas/user.schema';
import { XmtpService } from '../xmtp/xmtp.service';
import { WalletsService } from '../wallets/wallets.service';
import { HttpModule } from '@nestjs/axios'
import {
  ScheduleCSVByDay,
  WeekHour,
  Partial24hTime,
  validateWeekHour,
  validateWeekHourRange,
  validatePartial24hTime,
  WeekHourRange,
  toWeekHour,
  toWeekHourRanges,
  getOffsetFromUTC,
  transformScheduleRangesFromTz,
  tzToday,
  tzMonday,
  tzWeekHour,
  tzHourInfo,
  availability,
} from './bookings.utils';

const nowish = new Date();

const mockBooking = {
  status: 'initial',
  fromAddress: '0xbooking1',
  toUsername: 'username1',
  start: nowish,
  minutes: 30,
  msg: 'hello'
};

const mockUser: User = {
  username: "superuser",
  idAddress: "0x78a74b5D1A86704c573163C3aafB6e7234c9Da1e",
  idAddressIsPublic: true,
  schedule: {
    Sun: "",
    Mon: "9-17:30",
    Tue: "9-17:30",
    Wed: "9-17:30",
    Thu: "9-17:30",
    Fri: "9-17:30",
    Sat: "9-11:30"
  },
  bio: "Super person",
  password: "password1",
  tz: "Asia/Rangoon",
  twitterUsername: "tomoXtechno",
  assistantXmtpAddress: "0x78a74b5D1A86704c573163C3aafB6e7234c9Da1e",
  dateCreated: nowish
}

describe('BookingsService', () => {
  let service: BookingsService;
  let model: Model<Booking>;

  const BookingsArray = [
    {
      status: 'initial',
      fromAddress: '0xbooking1',
      toUsername: 'username1',
      start: nowish,
      minutes: 30,
      msg: 'hello'
    },
    {
      status: 'initial',
      fromAddress: '0xbooking2',
      toUsername: 'username2',
      start: nowish,
      minutes: 30,
      msg: 'hello'
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        BookingsService,
        UsersService,
        XmtpService,
        WalletsService,
        {
          provide: getModelToken('Booking'),
          useValue: {
            new: jest.fn().mockResolvedValue(mockBooking),
            constructor: jest.fn().mockResolvedValue(mockBooking),
            find: jest.fn(),
            create: jest.fn(),
            exec: jest.fn(),
          },
        },
        {
          provide: getModelToken('User'),
          useValue: {
            new: jest.fn().mockResolvedValue(mockUser),
            constructor: jest.fn().mockResolvedValue(mockUser),
            find: jest.fn(),
            create: jest.fn(),
            exec: jest.fn(),
          },
        },
        {
          provide: getModelToken('Wallet'),
          useValue: {
            new: jest.fn().mockResolvedValue({}),
            constructor: jest.fn().mockResolvedValue({}),
            find: jest.fn(),
            create: jest.fn(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    model = module.get<Model<Booking>>(getModelToken('Booking'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should work when yesterday in NYC', () => {
    const timeZone = 'America/New_York';
    const utcIsoDateTime = '2023-08-10T01:23';

    const today = tzToday(timeZone, utcIsoDateTime);

    expect(today.toISO()).toBe('2023-08-09T00:00:00.000-04:00');
  });

  it('should work when tomorrow in Tokyo', () => {
    const timeZone = 'Asia/Tokyo';
    const utcIsoDateTime = '2023-08-10T22:22';

    const today = tzToday(timeZone, utcIsoDateTime);

    expect(today.toISO()).toBe('2023-08-11T00:00:00.000+09:00');
  });

  it('should work when yesterday Sunday in NYC', () => {
    const timeZone = 'America/New_York';
    const utcIsoDateTime = '2023-08-07T01:23';

    const mondayOfWeek = tzMonday(timeZone, utcIsoDateTime);

    expect(mondayOfWeek.toISO()).toBe('2023-07-31T00:00:00.000-04:00');
  });

  it('should work when already Monday in VN', () => {
    const timeZone = 'Asia/Bangkok';
    const utcIsoDateTime = '2023-08-06T17:18';

    const mondayOfWeek = tzMonday(timeZone, utcIsoDateTime);

    expect(mondayOfWeek.toISO()).toBe('2023-08-07T00:00:00.000+07:00');
  });

  it('should return 1 when 1am Monday in UTC', () => {
    const timeZone = 'UTC';
    const utcIsoDateTime = '2023-08-07T01:01';

    const wh = tzWeekHour(timeZone, utcIsoDateTime);

    expect(wh).toBe(1);

    expect(tzHourInfo(timeZone, utcIsoDateTime)).toEqual({ date: '2023-08-07', times: ['01:00'] })
  });

  it('should return 1 when 6pm Sunday GMT = 1am Mon Vietnam', () => {
    const timeZone = 'Asia/Bangkok';
    const utcIsoDateTime = '2023-08-06T18:59';

    const wh = tzWeekHour(timeZone, utcIsoDateTime);

    expect(wh).toBe(1);

    expect(tzHourInfo(timeZone, utcIsoDateTime)).toEqual({ date: '2023-08-07', times: ['01:00'] })
  });

  it('should return 25 when 6pm Monday GMT = 1am Tue Vietnam', () => {
    const timeZone = 'Asia/Bangkok';
    const utcIsoDateTime = '2023-08-07T18:00';

    const wh = tzWeekHour(timeZone, utcIsoDateTime);

    expect(wh).toBe(25);

    expect(tzHourInfo(timeZone, utcIsoDateTime)).toEqual({ date: '2023-08-08', times: ['01:00'] })
  });

  it('should return 25 when 6pm Monday GMT = 1am Tue Vietnam', () => {
    const timeZone = 'Asia/Bangkok';
    const utcIsoDateTime = '2023-08-07T18:00';

    const wh = tzWeekHour(timeZone, utcIsoDateTime);

    expect(wh).toBe(25);
  });

  it('should return 167 when it is 11:00 p.m. in Detroit', () => {
    const timeZone = 'America/Detroit';
    const utcIsoDateTime = '2023-08-07T03:00:00.000Z';

    const wh = tzWeekHour(timeZone, utcIsoDateTime);

    expect(wh).toBe(167);
  });

  it('should return the correct UTC availability from week start', () => {
    const schedule: ScheduleCSVByDay = {
      Sun: "23:00-23:30",
      Mon: "1:30-2,10:00-16:00",
      Tue: "00-1",
      Wed: "",
      Thu: "",
      Fri: "",
      Sat: "",
    };

    const utcTimes = transformScheduleRangesFromTz(toWeekHourRanges(schedule), 'utc');
    // console.log(utcTimes);
    const timeZone = 'UTC';
    const utcIsoDateTime = '2023-08-07T01:00';
    const res = availability(utcTimes, timeZone, utcIsoDateTime);
    const expected = {
      '2023-08-13': [['23:00', '23:30']],
      '2023-08-07': [['01:30', '02:00'], ['10:00', '16:00']],
      '2023-08-08': [['00:00', '01:00']]
    }
    expect(res).toEqual(expected);
  });

  it('should return the correct VN schedule for UTC availability from week start', () => {
    const schedule: ScheduleCSVByDay = {
      Sun: "23:00-23:30",
      Mon: "1:30-2,10:00-16:00",
      Tue: "00-1",
      Wed: "",
      Thu: "",
      Fri: "",
      Sat: "",
    };

    const scheduleTz = 'Asia/Bangkok';
    const utcTimes = transformScheduleRangesFromTz(toWeekHourRanges(schedule), scheduleTz);
    // console.log(utcTimes);
    // [
    //   { start: 160, end: 160.5 },
    //   { start: 162.5, end: 163 },
    //   { start: 3, end: 9 },
    //   { start: 17, end: 18 }
    // ]

    const utcIsoDateTime = '2023-08-07T01:00';
    const viewTz = 'utc'
    const res = availability(utcTimes, viewTz, utcIsoDateTime);
    const expected = {
      '2023-08-13': [['16:00', '16:30'], ['18:30', '19:00']],
      '2023-08-07': [['03:00', '09:00'], ['17:00', '18:00']]
    }
    expect(res).toEqual(expected);
  });

  it('should return the correct UTC availability from weekend', () => {
    const schedule: ScheduleCSVByDay = {
      Sun: "23:00-23:30",
      Mon: "1:30-2,10:00-16:00",
      Tue: "00-1",
      Wed: "",
      Thu: "",
      Fri: "",
      Sat: "",
    };

    const utcTimes = transformScheduleRangesFromTz(toWeekHourRanges(schedule), 'utc');
    // console.log(utcTimes);
    const timeZone = 'UTC';
    const utcIsoDateTime = '2023-08-12T01:00';
    const res = availability(utcTimes, timeZone, utcIsoDateTime);
    const expected = {
      '2023-08-13': [['23:00', '23:30']],
      '2023-08-14': [['01:30', '02:00'], ['10:00', '16:00']],
      '2023-08-15': [['00:00', '01:00']]
    };

    expect(res).toEqual(expected);

  });

  it('should return the input value when it is within the valid range (0 to 168)', () => {
    expect(validateWeekHour(0)).toBe(0 as WeekHour);
    expect(validateWeekHour(100)).toBe(100 as WeekHour);
    expect(validateWeekHour(168)).toBe(168 as WeekHour);
  });

  it('should throw an error when the input value is outside the valid range', () => {
    expect(() => validateWeekHour(-1)).toThrowError('WeekHour must be between 0 and 168.');
    expect(() => validateWeekHour(200)).toThrowError('WeekHour must be between 0 and 168.');
  });

  it('should return the input value when it is in the valid 24-hour time format (HH:mm or HH)', () => {
    expect(validatePartial24hTime('15')).toBe('15' as Partial24hTime);
    expect(validatePartial24hTime('15:30')).toBe('15:30' as Partial24hTime);
    expect(validatePartial24hTime('01:00')).toBe('01:00' as Partial24hTime);
  });

  it('should throw an error when the input value is not in the valid 24-hour time format', () => {
    expect(() => validatePartial24hTime('25:00')).toThrowError(
      'Invalid partial 24-hour time format. Use HH or HH:mm format.'
    );
    expect(() => validatePartial24hTime('12:61')).toThrowError(
      'Invalid partial 24-hour time format. Use HH or HH:mm format.'
    );
    expect(() => validatePartial24hTime('abc')).toThrowError(
      'Invalid partial 24-hour time format. Use HH or HH:mm format.'
    );
  });

  it('should return the correct number of hours for the given day and time', () => {
    // Mock the current date as August 1, 2023 (Monday)
    const currentDate = DateTime.fromISO('2023-08-01');
    DateTime.now = jest.fn(() => currentDate);

    // Monday (Aug 1, 2023) at 12:00 AM
    expect(toWeekHour('Mon', '00:00')).toBe(0 as WeekHour);

    expect(toWeekHour('Mon', '09:00')).toBe(9 as WeekHour);

    expect(toWeekHour('Tue', '14:30')).toBe(38.5 as WeekHour);

    expect(toWeekHour('Sat', '08:45')).toBe(5 * 24 + 8.75 as WeekHour);

    expect(toWeekHour('Sun', '23:30')).toBe(167.5 as WeekHour);
  });

  it('should convert the CSV schedule in Schedule object to an array of WeekHourRange objects', () => {
    const schedule: ScheduleCSVByDay = {
      Sun: "9:00-12:30,14:30-18:00",
      Mon: "10:00-16:00",
      Tue: "9:00-17:00",
      Wed: "11:00-14:00,15:30-20:00",
      Thu: "8:00-13:00",
      Fri: "",
      Sat: "8:30-12:30",
    };

    const result = toWeekHourRanges(schedule);
    const expected = [
      { start: 153, end: 156.5 },
      { start: 158.5, end: 162 },
      { start: 10, end: 16 },
      { start: 33, end: 41 },
      { start: 59, end: 62 },
      { start: 63.5, end: 68 },
      { start: 80, end: 85 },
      { start: 128.5, end: 132.5 }
    ];

    expect(result).toEqual(expected as WeekHourRange[]);
  });

  it('should return the correct offset for a positive time zone offset', () => {
    // Test with a positive time zone offset (UTC+5:30, Indian Standard Time)
    const tz = 'Asia/Kolkata';
    const offset = getOffsetFromUTC(tz);
    expect(offset).toBe(5.5); // 5 hours and 30 minutes
  });

  it('should return the correct offset for a negative time zone offset', () => {
    // Test with a negative time zone offset (UTC-4, EDT)
    const tz = 'America/Detroit';
    const offset = getOffsetFromUTC(tz);
    expect(offset).toBe(-4);
  });

  it('should return 0 for UTC time zone', () => {
    // Test with UTC time zone
    const tz = 'UTC';
    const offset = getOffsetFromUTC(tz);
    expect(offset).toBe(0);
  });

  it('should handle daylight saving time changes', () => {
    // Test with a time zone that observes daylight saving time (UTC+1 or UTC+2, Central European Time)
    const tz = 'Europe/Paris';
    const offset = getOffsetFromUTC(tz);

    // Paris is in Central European Time (CET, UTC+1) during standard time
    // and Central European Summer Time (CEST, UTC+2) during daylight saving time (DST)
    // The offset will vary depending on whether daylight saving time is in effect or not.
    expect([1, 2]).toContain(offset);
  });

  it('should convert non-UTC hour ranges to UTC hour ranges with multiple offsets', () => {
    const sparseSchedule: WeekHourRange[] = [
      validateWeekHourRange({ start: 10, end: 30 }), // Monday: 10:00 AM to 6:00 AM (next day)
    ];

    const offsetsToTest: number[] = [-8, 0, 5, 10]; // Test with different offsets
    const tzs = ['America/Anchorage', 'UTC', 'Asia/Karachi', 'Australia/Sydney']

    const expectedResults = [
      [
        { start: 18, end: 38 },
      ],
      [
        { start: 10, end: 30 },
      ],
      [
        { start: 5, end: 25 },
      ],
      [
        { start: 0, end: 20 },
      ],
    ];

    // Test with each offset and verify the results
    tzs.forEach((tz, index) => {
      const result = transformScheduleRangesFromTz(sparseSchedule, tz);
      const expectedResult = expectedResults[index].map(validateWeekHourRange);
      expect(result).toEqual(expectedResult);
    });
  });

  it('should return the correct VN schedule offset to India', () => {
    const schedule: ScheduleCSVByDay = {
      Sun: "23:00-23:30",
      Mon: "1:30-2,10:00-16:00",
      Tue: "00-1",
      Wed: "",
      Thu: "",
      Fri: "",
      Sat: "",
    };
    // [
    //   { start: 167, end: 167.5 },
    //   { start: 1.5, end: 2 },
    //   { start: 10, end: 16 },
    //   { start: 24, end: 25 }
    // ]

    // const offsetIST = getOffsetFromUTC('Asia/Kolkata');
    // const offsetICT = getOffsetFromUTC('Asia/Bangkok');
    // const offset = offsetICT - offsetIST;
    // console.log(offset);
    // console.log(toWeekHourRanges(schedule));
    const indianTimes = transformScheduleRangesFromTz(toWeekHourRanges(schedule), 'Asia/Bangkok', 'Asia/Kolkata');
    // console.log(indianTimes);
    const expected = [
      { start: 165.5, end: 166 },
      { start: 0, end: 0.5 },
      { start: 8.5, end: 14.5 },
      { start: 22.5, end: 23.5 }
    ];
    expect(indianTimes).toEqual(expected);
  });

  it('should return the correct VN schedule offset to UTC', () => {
    const schedule: ScheduleCSVByDay = {
      Sun: "",
      Mon: "1:30-2,10:00-16:00",
      Tue: "00-1",
      Wed: "",
      Thu: "",
      Fri: "",
      Sat: "",
    };
    // [
    //   { start: 1.5, end: 2 },
    //   { start: 10, end: 16 },
    //   { start: 24, end: 25 }
    // ]

    // console.log(toWeekHourRanges(schedule));
    const utcTimes = transformScheduleRangesFromTz(toWeekHourRanges(schedule), 'Asia/Bangkok');
    // console.log(utcTimes);
    const expected = [
      { start: 162.5, end: 163 },
      { start: 3, end: 9 },
      { start: 17, end: 18 }
    ];
    expect(utcTimes).toEqual(expected);
  });

  it('should return all bookings', async () => {
    jest.spyOn(model, 'find').mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(BookingsArray),
    } as any);
    const bookings = await service.findAll();
    expect(bookings).toEqual(BookingsArray);
  });

  it('should insert a new booking', async () => {
    jest.spyOn(model, 'create').mockImplementationOnce(() =>
      Promise.resolve({
        status: 'initial',
        fromAddress: '0xbooking1',
        toUsername: 'username1',
        start: nowish,
        minutes: 30,
        msg: 'hello'
      } as any),
    );
    const newBooking = await service.create({
      status: 'initial',
      fromAddress: '0xbooking1',
      toUsername: 'username1',
      start: nowish,
      minutes: 30,
      msg: 'hello'
    });
    expect(newBooking).toEqual(mockBooking);
  });
});
