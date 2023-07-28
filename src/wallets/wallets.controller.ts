import { Controller, Get } from '@nestjs/common';
import { WalletsService } from './wallets.service';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  // Add endpoints here as needed

  @Get('testEthLogin')
  async testEthLogin() {
    return this.walletsService.testEthLogin();
  }
}
