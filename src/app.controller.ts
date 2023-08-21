import { Controller, Get, Patch, Req, Res, Post, Session, UseGuards, Query, BadRequestException, Param } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth/auth.service';
import { BookingsService } from './bookings/bookings.service';
import { UsersService } from './users/users.service';
import { UserDocument } from './users/schemas/user.schema';
import { SessionNonceStore } from 'passport-ethereum-siwe';
import * as fs from 'fs';

@Controller()
export class AppController {
  constructor(
    private authService: AuthService,
    private bookingsService: BookingsService,
    private usersService: UsersService,
  ) { }

  // The @Req() decorator is imported from the @nestjs/common, while Request from the express package.
  // async getChallenge(@Request() req) { // @Request from '@nestjs/common': Extracts the `Request` object from the underlying platform and populates the decorated parameter with the value of `Request`.
  // async getChallenge(@Req() req: Request ) { // Request from 'express'

  @Get('challenge')
  async getChallenge(@Req() req) {
    const store = new SessionNonceStore();
    console.log(req.session);

    const nonce = await new Promise((resolve, reject) => {
      store.challenge(req, (err, nonce) => {
        if (err) { reject(err); }
        console.log('GET /challenge:', nonce);
        resolve(nonce);
      });
    });

    // res.json({ nonce: nonce });
    // return nonce; // same but not json
    return req.session['ethereum:siwe'];
  }

  @UseGuards(AuthGuard('ethereum'))
  @Post('auth/ethloginjwt')
  // async ethloginjwt(@Req() req: Request) { // .user of Request is different
  async ethloginjwt(@Req() req) {
    // TODO create a @User() decorator
    const user: UserDocument = req.user;
    req.session['idAddress'] = user.idAddress;
    return this.authService.ethloginjwt(user);
  }

  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async login(@Req() req) {
    return this.authService.login(req.user);
  }

  @Get('auth/twitter')
  @UseGuards(AuthGuard('twitter'))
  twitterLogin() {
    // XXX never reaches here
    console.log('twitterLogin XXX never reaches here');
    debugger;
  }

  // @Get('auth/twitter/callback') // TODO-example
  @Get('oauth/callback/twitter')
  @UseGuards(AuthGuard('twitter'))
  twitterCallback(@Session() session: { views?: number }, @Req() req, @Res() res) {
    res.redirect('/schedl-ui');
  }

  @Get('user/:username')
  async getUserPage(@Param('username') username: string, @Res() res) {
    const filePath = process.env.NEXT_OUT_DIR + '/user/[username].html';
    const htmlContent = await fs.promises.readFile(filePath, 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me')
  usersMe(@Req() req) {
    return this.usersService.findOne(req.user.idAddress);
  }

  @Get('users/availability')
  async usersAvailability(@Query('username') username: string, @Query('tz') tz: string) {
    return this.bookingsService.availabilityByUsername(username, tz);
  }

  @Get('users')
  async usersUsername(@Query('username') username: string) {
    return this.usersService.getProfileByUsername(username);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('users/me/:property')
  async updateProfileProperty(@Req() req, @Param('property') property: string) {
    switch (property) {
      case 'username':
        return this.usersService.setUsername(req.user.idAddress, req.body[property]);
      case 'idAddressIsPublic':
        return this.usersService.setIdAddressIsPublic(req.user.idAddress, req.body[property]);
      case 'assistantXmtpAddress':
        return this.usersService.setAssistantXmtpAddress(req.user.idAddress, req.body[property]);
      case 'bio':
        return this.usersService.setBio(req.user.idAddress, req.body[property]);
      case 'tz':
        return this.usersService.setTz(req.user.idAddress, req.body[property]);
      case 'schedule':
        return this.usersService.setSchedule(req.user.idAddress, req.body[property]);
      default:
        throw new BadRequestException('Invalid property');
    }
  }

}