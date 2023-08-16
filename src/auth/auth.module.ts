import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { EthereumStrategy } from './ethereum.strategy';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { TwitterStrategy } from './twitter.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TwitterProfile, TwitterProfileSchema } from './twitter-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TwitterProfile.name, schema: TwitterProfileSchema }]),
    UsersModule,
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '86400s' },
    }),
  ],
  providers: [AuthService, EthereumStrategy, LocalStrategy, JwtStrategy, TwitterStrategy],
  exports: [AuthService],
})
export class AuthModule {}