import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';

@Injectable()
export class WalletsService {
  constructor(@InjectModel(Wallet.name) private walletModel: Model<WalletDocument>) {}

  async create(wallet: Wallet) {
    const createdWallet = new this.walletModel(wallet);
    return createdWallet.save();
  }
}
