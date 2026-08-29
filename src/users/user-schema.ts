import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
}
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}
export type UserDocument = HydratedDocument<User>;
@Schema({
  timestamps: true,
})
export class User {
  @Prop({ type: String, required: true, trim: true, lowercase: true })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email: string;

  @Prop({ type: String, required: true, select: false, trim: true })
  password: string;

  @Prop({ type: Date, select: false })
  passwordChangedAt: Date;

  @Prop({ type: String, trim: true })
  address: string;

  @Prop({ type: Date, required: true })
  dateOfBirth: Date;

  @Prop({ type: String, required: true, trim: true })
  phone: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.PATIENT })
  role: UserRole;

  @Prop({ type: String, required: true, enum: Gender })
  gender: Gender;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}
export const UserSchema = SchemaFactory.createForClass(User);
