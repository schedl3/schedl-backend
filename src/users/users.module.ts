import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';
import { XmtpModule } from '../xmtp/xmtp.module';
import { XmtpService } from '../xmtp/xmtp.service';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    XmtpModule,
    WalletsModule,
  ],
  providers: [UsersService, XmtpService],
  exports: [UsersService],
})
export class UsersModule {}
