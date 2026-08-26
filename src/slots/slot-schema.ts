// src/services/schemas/service.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type slotDocument = HydratedDocument<Slot>;
export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  CANCELLED = 'CANCELLED',
}
@Schema({ timestamps: true })
export class Slot {
  @Prop({ type: Types.ObjectId, ref: 'Doctor' })
  doctorId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  startTime: Date; // مثال: 2026-08-25T09:00:00.000Z

  @Prop({ type: Date, required: true })
  endTime: Date; // مثال: 2026-08-25T09:30:00.000Z

  @Prop({ type: Number, required: true })
  numOfPatient: number;

  @Prop({ type: String, enum: SlotStatus, default: SlotStatus.AVAILABLE })
  status: SlotStatus;
}

export const SlotSchema = SchemaFactory.createForClass(Slot);
