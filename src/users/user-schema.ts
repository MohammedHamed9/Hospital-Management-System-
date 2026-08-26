import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export enum UserRole {
  Patient = 'Pateint',
  Doctor = 'Doctor',
  Admin = 'Admin',
}
export enum Gender {
  Male = 'Male',
  Female = 'Female',
}
export type UserDocument = HydratedDocument<User>;
@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String })
  address: string;

  @Prop({ type: Date, required: true })
  dateOfBirth: Date;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.Patient })
  role: UserRole;

  @Prop({ type: String, required: true, enum: Gender })
  gender: Gender;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}
export const UserSchema = SchemaFactory.createForClass(User);
