import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { ethers } from 'ethers';
import axios from 'axios';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    private httpService: HttpService,
  ) { }

  async create(wallet: Wallet) {
    const createdWallet = new this.walletModel(wallet);
    return createdWallet.save();
  }

  async getLatestWallet() {
    return await this.walletModel.findOne().sort({ _id: -1 }).exec();
  }

  async testEthLogin() {
    const latestWallet = await this.getLatestWallet();
    const wallet = new ethers.Wallet(latestWallet.privateKey);

    // Request the challenge
    const challengeResponse = await axios.get('http://localhost:3000/challenge', { withCredentials: true });
    const nonce = challengeResponse.data.nonce;
    const cookies = challengeResponse.headers['set-cookie'];

    // Sign the message
    const message = `localhost:3000 wants you to sign in with your Ethereum account:\n${latestWallet.address}\n\nSign in with Ethereum to the app.\n\nURI: http://localhost:3000\nVersion: 1\nChain ID: 1\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}`;
    const signature = await wallet.signMessage(message);

    // Post to '/auth/ethlogin'
    const loginResponse = await axios.post('http://localhost:3000/auth/ethlogin', { message, signature }, { headers: { 'Cookie': cookies } });

    return loginResponse.data;
  }
}
