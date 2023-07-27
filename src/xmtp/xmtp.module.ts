import { Module } from '@nestjs/common';
import { XmtpService } from './xmtp.service';
import { XmtpController } from './xmtp.controller';

@Module({
  providers: [XmtpService],
  controllers: [XmtpController],
})
export class XmtpModule {}
