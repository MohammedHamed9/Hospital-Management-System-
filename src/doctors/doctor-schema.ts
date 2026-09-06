import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type DoctorDocument = HydratedDocument<Doctor>;
@Schema({ timestamps: true })
export class Doctor {
  @Prop({ type: Types.ObjectId, ref: 'User', unique: true, required: true })
  userId: Types.ObjectId;
  
  @Prop({ required: true })
  specialization: string;

  @Prop({ required: true })
  experience: number;

  @Prop({ required: true })
  consultationFee: number;

  @Prop()
  bio: string;

  @Prop()
  image: string;
}
export const DoctorSchema = SchemaFactory.createForClass(Doctor);
