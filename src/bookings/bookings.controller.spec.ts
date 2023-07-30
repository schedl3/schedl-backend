import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingsService } from './bookings.service';

const nowish = new Date();

describe('Bookings Controller', () => {
  let controller: BookingsController;
  let service: BookingsService;
  const createBookingDto: CreateBookingDto = {
    fromAddress: '0xbooking1',
    toUsername: 'username1',
    start: nowish,
    minutes: 30,
    msg: 'hello'
  };

  const mockBooking = {
    fromAddress: '0xbooking1',
    toUsername: 'username1',
    start: nowish,
    minutes: 30,
    msg: 'hello',
    _id: 'a id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([
              {
                fromAddress: '0xbooking1',
                toUsername: 'username1',
                start: nowish,
                minutes: 30,
                msg: 'hello'
              },
              {
                fromAddress: '0xbooking2',
                toUsername: 'username2',
                start: nowish,
                minutes: 30,
                msg: 'hello'
              },
              {
                fromAddress: '0xbooking3',
                toUsername: 'username3',
                start: nowish,
                minutes: 30,
                msg: 'hello'
              },
            ]),
            create: jest.fn().mockResolvedValue(createBookingDto),
          },
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);
  });

  describe('create()', () => {
    it('should create a new booking', async () => {
      const createSpy = jest
        .spyOn(service, 'create')
        .mockResolvedValueOnce(mockBooking);

      await controller.create(createBookingDto);
      expect(createSpy).toHaveBeenCalledWith(createBookingDto);
    });
  });

  describe('findAll()', () => {
    it('should return an array of bookings', async () => {
      expect(controller.findAll()).resolves.toEqual([
        {
          fromAddress: '0xbooking1',
          toUsername: 'username1',
          start: nowish,
          minutes: 30,
          msg: 'hello'
        },
        {
          fromAddress: '0xbooking2',
          toUsername: 'username2',
          start: nowish,
          minutes: 30,
          msg: 'hello'
        },
        {
          fromAddress: '0xbooking3',
          toUsername: 'username3',
          start: nowish,
          minutes: 30,
          msg: 'hello'
        },
      ]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });
});
