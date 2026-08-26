// src/services/schemas/service.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ServicesBookingDocument = HydratedDocument<ServicesBooking>;

@Schema({ timestamps: true })
export class ServicesBooking {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service' })
  serId: Types.ObjectId;

  @Prop({ type: Date })
  date: Date;
}

export const ServicesBookingSchema =
  SchemaFactory.createForClass(ServicesBooking);
