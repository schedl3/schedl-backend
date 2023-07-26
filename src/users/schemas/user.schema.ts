import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  ethereumAddress: string;

  @Prop({ required: true })
  emailAddress: string;

  @Prop()
  description: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
