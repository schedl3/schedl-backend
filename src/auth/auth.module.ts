import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EthereumStrategy } from './ethereum.strategy';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { config } from 'dotenv';

config();

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '3600s' },
    }),
  ],
  providers: [AuthService, EthereumStrategy, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}