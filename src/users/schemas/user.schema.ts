import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export class Schedule {
  @Prop({ required: true })
  Sun: string;

  @Prop({ required: true })
  Mon: string;

  @Prop({ required: true })
  Tue: string;

  @Prop({ required: true })
  Wed: string;

  @Prop({ required: true })
  Thu: string;

  @Prop({ required: true })
  Fri: string;

  @Prop({ required: true })
  Sat: string;
}

@Schema()
export class User {
  @Prop({ index: true, unique: true })
  username: string;

  @Prop({ index: true, unique: true })
  idAddress: string;

  @Prop()
  idAddressIsPublic: boolean;

  @Prop()
  schedule: Schedule;

  @Prop({ index: true })
  ethereumAddress: string;

  @Prop()
  emailAddress: string;

  @Prop()
  description: string;

  @Prop()
  password: string;

  @Prop()
  tz: string;

  @Prop()
  assistantXmtpAddress: string;

  @Prop({ default: Date.now })
  dateCreated: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
