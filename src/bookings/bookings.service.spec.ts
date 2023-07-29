import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { BookingsService } from './bookings.service';
import { booking } from './schemas/booking.schema';

const mockBooking = {
  name: 'booking #1',
  breed: 'Breed #1',
  age: 4,
};

describe('BookingsService', () => {
  let service: BookingsService;
  let model: Model<booking>;

  const BookingsArray = [
    {
      name: 'booking #1',
      breed: 'Breed #1',
      age: 4,
    },
    {
      name: 'booking #2',
      breed: 'Breed #2',
      age: 2,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getModelToken('booking'),
          useValue: {
            new: jest.fn().mockResolvedValue(mockBooking),
            constructor: jest.fn().mockResolvedValue(mockBooking),
            find: jest.fn(),
            create: jest.fn(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    model = module.get<Model<booking>>(getModelToken('booking'));
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
        name: 'booking #1',
        breed: 'Breed #1',
        age: 4,
      } as any),
    );
    const newBooking = await service.create({
      name: 'booking #1',
      breed: 'Breed #1',
      age: 4,
    });
    expect(newBooking).toEqual(mockBooking);
  });
});
