
import { Controller, Get, Request, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth/auth.service';
import { XmtpService } from './xmtp/xmtp.service';
import { UsersService } from './users/users.service';
import { Strategy as EthStrategy, SessionNonceStore } from 'passport-ethereum-siwe';
import * as util from 'util';

@Controller()
export class AppController {
  constructor(
    private authService: AuthService,
    private xmtpService: XmtpService,
    private usersService: UsersService,  
  ) { }

  @Get('challenge')
  async getChallenge(@Request() req) {
    const store = new SessionNonceStore();
    console.log(req.session);

    const nonce = await new Promise((resolve, reject) => {
      store.challenge(req, (err, nonce) => {
        if (err) { reject(err); }
        console.log('get challenge', err, nonce);
        resolve(nonce);
      });
    });

    // res.json({ nonce: nonce });
    // return nonce; // same but not json
    return req.session['ethereum:siwe'];
  }

  @UseGuards(AuthGuard('ethereum'))
  @Post('auth/ethlogin')
  async ethlogin(@Request() req) {
    return this.authService.ethlogin(req.user);
  }

  @UseGuards(AuthGuard('ethereum'))
  @Post('auth/ethloginjwt')
  async ethloginjwt(@Request() req) {
    return this.authService.ethloginjwt(req.user);
  }

  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }


  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('setUsername')
  async setUsername(@Request() req) {
    return this.usersService.setUsername(req.user, req.body.username);
  }
}