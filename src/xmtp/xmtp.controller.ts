import { Controller, UseGuards, Post } from '@nestjs/common';
import { XmtpService } from './xmtp.service';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class XmtpController {
  constructor(private readonly xmtpService: XmtpService) {}

  @UseGuards(AuthGuard('local'))
  @Post('genGmWallet')
  async genGmWallet() {
    await this.xmtpService.genGmWallet();
  }
}
