import { Body, Controller, Delete, Get, Param, Post, UseGuards, Request, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CustomAuthGuard } from '../auth/auth.guard';
import { BookingsService } from './bookings.service';
import { UsersService } from '../users/users.service';
import { XmtpService } from '../xmtp/xmtp.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking } from './schemas/booking.schema';

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

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly usersService: UsersService,
    private readonly xmtpService: XmtpService,
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
    return this.bookingsService.makeRequest(req.user, req.body);
  }
}
