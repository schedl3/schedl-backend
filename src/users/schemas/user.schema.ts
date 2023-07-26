import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ index: true })
  idAddress: string;

  @Prop({ index: true })
  ethereumAddress: string;

  @Prop()
  emailAddress: string;

  @Prop()
  description: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
