import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PrescriptionDocument = HydratedDocument<Prescription>;

export enum PrescriptionStatus {
  DRAFT = 'DRAFT',
  FINAL = 'FINAL',
}

@Schema({ _id: true })
export class PrescriptionItem {
  @Prop({ type: String, required: true })
  medicineName: string;

  @Prop({ type: String, required: true })
  dosage: string;

  @Prop({ type: String, required: true })
  frequency: string;

  @Prop({ type: String, required: true })
  duration: string;

  @Prop({ type: String, required: false })
  instructions?: string;
}

export const PrescriptionItemSchema =
  SchemaFactory.createForClass(PrescriptionItem);

@Schema({ timestamps: true })
export class Prescription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  doctorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Appointment', required: true })
  appointmentId: Types.ObjectId;

  @Prop({
    type: String,
    enum: PrescriptionStatus,
    default: PrescriptionStatus.DRAFT,
  })
  status: PrescriptionStatus;

  @Prop({ type: String, required: false })
  notes?: string;

  @Prop({ type: [PrescriptionItemSchema], default: [] })
  items: PrescriptionItem[];

  @Prop({ type: Date, required: false })
  finalizedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PrescriptionSchema = SchemaFactory.createForClass(Prescription);
