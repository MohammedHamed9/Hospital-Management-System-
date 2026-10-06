import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
export enum ServicesBookingStatus {
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}
export type ServicesBookingDocument = HydratedDocument<ServicesBooking>;

@Schema({ timestamps: true })
export class ServicesBooking {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service' })
  serviceId: Types.ObjectId;

  @Prop({ type: Date })
  date: Date;

  @Prop({ type: String, enum: ServicesBookingStatus })
  status: ServicesBookingStatus;
}

export const ServicesBookingSchema =
  SchemaFactory.createForClass(ServicesBooking);
ServicesBookingSchema.index({ userId: 1, serviceId: 1 }, { unique: true });
