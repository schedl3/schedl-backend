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
