import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { Client } from '@xmtp/xmtp-js';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class XmtpService {
  constructor(private readonly walletsService: WalletsService) {}

  async genWallet() {
    const wallet = ethers.Wallet.createRandom();
    await this.walletsService.create({
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
      address: wallet.address,
    });
    return wallet;
  }

  async gm() {
    const latestWallet = await this.walletsService.getLatestWallet();
    const wallet = new ethers.Wallet(latestWallet.privateKey);
    let xmtpOpts = { env: "production" };
    const xmtp = await Client.create(wallet, { env: "production" });
    const WALLET_TO = '0x78a74b5D1A86704c573163C3aafB6e7234c9Da1e';
    const conversation = await xmtp.conversations.newConversation(WALLET_TO);
    console.log("Conversation created", conversation);
    const message = await conversation.send("gm");
    console.log("Message sent", message);
  }
}

