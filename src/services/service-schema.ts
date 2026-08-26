// src/services/schemas/service.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

export enum ServiceCategory {
  LAB = 'LAB',
  RADIOLOGY = 'RADIOLOGY',
  TREATMENT = 'TREATMENT',
}

@Schema({ timestamps: true })
export class Service {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: ServiceCategory, required: true })
  category: ServiceCategory;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
