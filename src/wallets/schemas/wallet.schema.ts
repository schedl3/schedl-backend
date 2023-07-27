import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema()
export class Wallet {
  @Prop({ required: true })
  privateKey: string;

  @Prop({ required: true })
  publicKey: string;

  @Prop({ required: true })
  address: string;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
