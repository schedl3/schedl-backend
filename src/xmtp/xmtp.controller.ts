import { Controller, UseGuards, Post } from '@nestjs/common';
import { XmtpService } from './xmtp.service';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class XmtpController {
  constructor(private readonly xmtpService: XmtpService) {}

  // @UseGuards(AuthGuard('local'))
  @Post('genWallet')
  async genWallet() {
    return await this.xmtpService.genWallet();
  }

  // @UseGuards(AuthGuard('local'))
  @Post('gm')
  async gm(@Body() body: { wallet: Wallet }) {
    return await this.xmtpService.gm(body.wallet);
  }
}
