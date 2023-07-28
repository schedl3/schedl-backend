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
  ) {}

  async create(wallet: Wallet) {
    const createdWallet = new this.walletModel(wallet);
    return createdWallet.save();
  }

  async getLatestWallet() {
    return await this.walletModel.findOne().sort({ _id: -1 }).exec();
  }

  async testEthLogin() {
    const latestWallet = await this.getLatestWallet();
    const wallet = new ethers.Wallet(latestWallet._doc.privateKey); 
    // latestWallet._doc.privateKey

    // Request the challenge
    const challengeResponse = await axios.get('http://localhost:3000/challenge', { withCredentials: true });
    const nonce = challengeResponse.data.nonce;
    const cookies = challengeResponse.headers['set-cookie'];

    // Sign the message
    const message = `localhost:3000 wants you to sign in with your Ethereum account:\n0x78a74b5D1A86704c573163C3aafB6e7234c9Da1e\n\nSign in with Ethereum to the app.\n\nURI: http://localhost:3000\nVersion: 1\nChain ID: 1\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}`;
    const signature = '0x9003c26650dbc4636109eb75014a0b1f50483908a001d79d316d240fc7bbc3c260767d8918c4720d5579a319fa8ba88b3e581538a441366963b3afe794f642521c'; // Replace this with the actual signature
    // const signature = await wallet.signMessage(message);
    // Post to '/auth/ethlogin'
    const loginResponse = await axios.post('http://localhost:3000/auth/ethlogin', { message, signature }, { headers: { 'Cookie': cookies } });

    return loginResponse.data;
  }
}
