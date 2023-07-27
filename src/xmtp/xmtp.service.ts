import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { Client } from '@xmtp/xmtp-js';

@Injectable()
export class XmtpService {
  async genGmWallet() {
    const wallet = ethers.Wallet.createRandom();
    const xmtp = await Client.create(wallet, { env: "dev" });
    const conversation = await xmtp.conversations.newConversation('gm.xmtp.eth');
    console.log("Conversation created", conversation);
    const message = await conversation.send("gm");
    console.log("Message sent", message);
  }
}
