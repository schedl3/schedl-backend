import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class TwitterProfile extends Document {
    @Prop({ required: true })
    profile_raw: string; // 'json' field of any type
}

export const TwitterProfileSchema = SchemaFactory.createForClass(TwitterProfile);