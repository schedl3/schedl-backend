import { Controller, UseGuards, Post } from '@nestjs/common';
import { XmtpService } from './xmtp.service';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class XmtpController {
  constructor(private readonly xmtpService: XmtpService) {}

  // TODO SuperUserGuard
  // @UseGuards(AuthGuard('local'))
  @Post('genWallet')
  async genWallet() {
    return await this.xmtpService.genWallet();
  }

  // @UseGuards(AuthGuard('local'))
  @Post('gm')
  async gm() {
    return await this.xmtpService.gm();
  }
}
