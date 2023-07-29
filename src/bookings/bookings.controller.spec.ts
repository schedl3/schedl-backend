import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingsService } from './bookings.service';

describe('Bookings Controller', () => {
  let controller: BookingsController;
  let service: BookingsService;
  const createBookingDto: CreateBookingDto = {
    name: 'booking #1',
    breed: 'Breed #1',
    age: 4,
  };

  const mockBooking = {
    name: 'booking #1',
    breed: 'Breed #1',
    age: 4,
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
                name: 'booking #1',
                breed: 'Bread #1',
                age: 4,
              },
              {
                name: 'booking #2',
                breed: 'Breed #2',
                age: 3,
              },
              {
                name: 'booking #3',
                breed: 'Breed #3',
                age: 2,
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
          name: 'booking #1',
          breed: 'Bread #1',
          age: 4,
        },
        {
          name: 'booking #2',
          breed: 'Breed #2',
          age: 3,
        },
        {
          name: 'booking #3',
          breed: 'Breed #3',
          age: 2,
        },
      ]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });
});
