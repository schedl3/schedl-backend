import { Module } from '@nestjs/common';
import { XmtpService } from './xmtp.service';
import { XmtpController } from './xmtp.controller';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [WalletsModule],
  providers: [XmtpService],
  controllers: [XmtpController],
})
export class XmtpModule {}
