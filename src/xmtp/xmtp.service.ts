import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { Client } from '@xmtp/xmtp-js';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class XmtpService {
  constructor(private readonly walletsService: WalletsService) { }

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

  async sendMessage(msg: string, addressToSendTo: string) {
    const latestWallet = await this.walletsService.getLatestWallet();
    const wallet = new ethers.Wallet(latestWallet.privateKey);
    let xmtpOpts = { env: "production" };
    const xmtp = await Client.create(wallet, { env: "production" });
    const isOnProdNetwork = await xmtp.canMessage(addressToSendTo);
    console.log(addressToSendTo, "Can message: " + isOnProdNetwork);
    if (!isOnProdNetwork) {
      throw new Error("Address is not on production network");
    }
    const conversation = await xmtp.conversations.newConversation(addressToSendTo);
    console.log("Conversation created", conversation);
    const message = await conversation.send(msg);
    console.log("Message sent", message);
  }

  async sendMessageAwaitConfirmation(msg: string, addressToSendTo: string, onConfirmation: (newStatus: string) => void) {
    const latestWallet = await this.walletsService.getLatestWallet();
    const wallet = new ethers.Wallet(latestWallet.privateKey);
    let xmtpOpts = { env: "production" };
    const xmtp = await Client.create(wallet, { env: "production" });
    const isOnProdNetwork = await xmtp.canMessage(addressToSendTo);
    console.log(addressToSendTo, "Can message: " + isOnProdNetwork);
    if (!isOnProdNetwork) {
      throw new Error("Address is not on production network");
    }
    const conversation = await xmtp.conversations.newConversation(addressToSendTo);
    console.log("Conversation created", conversation);
    let wrappedMsg;
    if (msg == 'SET-ASSISTANT') {
      wrappedMsg = `Set ASSISTANT request from someone:\n\n${msg}\n\nReply with "confirm" or "reject"`
    } else {
      wrappedMsg = `Booking request from someone:\n\n${msg}\n\nReply with "confirm" or "reject"`
    }
    const message = await conversation.send(wrappedMsg);
    console.log("Message sent", message);
    let sent;
    for await (const message of await xmtp.conversations.streamAllMessages()) {
      console.log(`New message from ${message.senderAddress}: ${message.content}`);
      // if (message.content === "Please reply with 'confirm' or 'reject'") {
      if (sent && message.id == sent.id) {
        console.log("Message sent", message.id);
        continue;
      }
      if (message.content === 'confirm') {
        conversation.send("Confirmed");
        onConfirmation('confirmed');
        return;
      } else if (message.content === 'reject') {
        conversation.send("Rejected");
        onConfirmation('rejected');
        return;
      } else {
        try {
          sent = await conversation.send("Please reply with 'confirm' or 'reject'");
        } catch (error) {
          console.error(`Error sending/awaiting conversation, abort confirming: ${error}`);
        }
        return;
      }
    }
  }

}

