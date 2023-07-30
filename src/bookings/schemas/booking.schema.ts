import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BookingDocument = HydratedDocument<booking>;

@Schema()
export class booking {
  @Prop()
  fromAddress: string;

  @Prop()
  toUsername: string;
  
  @Prop()
  start: Date;

  @Prop()
  minutes: number;

  @Prop()
  msg: string;
  
}

export const BookingSchema = SchemaFactory.createForClass(booking);
