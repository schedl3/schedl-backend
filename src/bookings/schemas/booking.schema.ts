import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as sanitizeHtml from 'sanitize-html';


console.log('typeof sanitizeHtml', typeof sanitizeHtml);
export type BookingDocument = HydratedDocument<Booking>;

@Schema()
export class Booking {
  @Prop({
    type: String,
    enum: ['initial', 'notified', 'confirmed', 'busy'],
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

  @Prop({
    set: (value: string) => sanitizeHtml(value),
  })
  msg: string;
  
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
