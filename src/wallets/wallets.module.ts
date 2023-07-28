import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './schemas/wallet.schema';

@Module({
  imports: [HttpModule, MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }])],
  providers: [WalletsService],
  controllers: [WalletsController],
  exports: [WalletsService],
})
export class WalletsModule {}
