import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BookingDocument = HydratedDocument<Booking>;

@Schema()
export class Booking {
  @Prop({
    type: String,
    enum: ['initial', 'confirmed', 'busy'],
    default: 'initial'
  })
  status: string;

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

export const BookingSchema = SchemaFactory.createForClass(Booking);
