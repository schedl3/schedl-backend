import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { Client } from '@xmtp/xmtp-js';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class XmtpService {
  constructor(private readonly walletsService: WalletsService) {}

  async genGmWallet() {
    const wallet = ethers.Wallet.createRandom();
    const xmtp = await Client.create(wallet, { env: "dev" });
    const WALLET_TO = "0x20B572bE48527a770479744AeC6fE5644F97678B"; // gm.xmtp.eth not resolving
    const conversation = await xmtp.conversations.newConversation(WALLET_TO);
    console.log("Conversation created", conversation);
    const message = await conversation.send("gm");
    console.log("Message sent", message);

    // Save the wallet using the WalletsService
    await this.walletsService.create({
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
      address: wallet.address,
    });

    // will block
    // for await (const message of await xmtp.conversations.streamAllMessages()) {
    //   console.log(`New message from ${message.senderAddress}: ${message.content}`);
    // }
  }
}
