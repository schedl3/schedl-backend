import { Module } from '@nestjs/common';
import { NestSessionOptions, SessionModule } from 'nestjs-session';
import { MongooseModule } from '@nestjs/mongoose';
import { CatsModule } from './cats/cats.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { XmtpModule } from './xmtp/xmtp.module';
import { WalletsModule } from './wallets/wallets.module';
import { XmtpService } from './xmtp/xmtp.service';
import { AppController } from './app.controller';
import * as session from 'express-session';
import * as connectMongoDbSession from 'connect-mongodb-session';

const MongoDBStore = connectMongoDbSession(session);

@Module({
  imports: [
    SessionModule.forRoot({
      session: {
        secret: 'keyboard cat',
        store: new MongoDBStore({
          uri: 'mongodb://localhost:27017/cats',
          collection: 'sessions'
        }),
      },
    }),
    MongooseModule.forRoot('mongodb://localhost:27017/cats'),
    CatsModule,
    AuthModule,
    UsersModule,
    XmtpModule,
  ],
  controllers: [AppController],
  providers: [XmtpService],
})
export class AppModule {}
