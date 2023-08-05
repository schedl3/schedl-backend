import { Controller, Get, Req, Res, Post, Session, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { CustomAuthGuard } from './auth/auth.guard';
import { AuthService } from './auth/auth.service';
import { BookingsService } from './bookings/bookings.service';
import { XmtpService } from './xmtp/xmtp.service';
import { UsersService } from './users/users.service';
import { UserDocument } from './users/schemas/user.schema';
import { SessionNonceStore } from 'passport-ethereum-siwe';

@Controller()
export class AppController {
  constructor(
    private authService: AuthService,
    private bookingsService: BookingsService,
    private xmtpService: XmtpService,
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
    res.redirect('https://localhost:3130/schedl-ui');
  }

  @UseGuards(CustomAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/schedule')
  getProfileSchedule(@Req() req) {
    return this.usersService.findOne(req.user.idAddress);
  }

  @UseGuards(JwtAuthGuard)
  @Post('setUsername')
  async setUsername(@Req() req) {
    return this.usersService.setUsername(req.user.idAddress, req.body.username);
  }

  @UseGuards(JwtAuthGuard)
  @Post('setAssistantXmtpAddress')
  async setAssistantXmtpAddress(@Req() req) {
    return this.usersService.setAssistantXmtpAddress(req.user.idAddress, req.body.assistantXmtpAddress);
  }

  @UseGuards(JwtAuthGuard)
  @Post('setBio')
  async setBio(@Req() req) {
    return this.usersService.setBio(req.user.idAddress, req.body.bi);
  }

  @UseGuards(JwtAuthGuard)
  @Post('setTz')
  async setTz(@Req() req) {
    return this.usersService.setTz(req.user.idAddress, req.body.tz);
  }

  @UseGuards(JwtAuthGuard)
  @Post('updateSchedule')
  async updateSchedule(@Req() req) {
    return this.usersService.updateSchedule(req.user.idAddress, req.body.schedule);
  }

  @UseGuards(JwtAuthGuard)
  @Post('toggleIdAddressIsPublic')
  async toggleIdAddressIsPublic(@Req() req) {
    const user = await this.usersService.findOne(req.user.idAddress);
    return this.usersService.setIdAddressIsPublic(req.user.idAddress, !user.idAddressIsPublic);
  }

  @Get('profile/:username')
  async getProfileByUsername(@Param('username') username: string) {
    return this.usersService.getProfileByUsername(username);
  }
}