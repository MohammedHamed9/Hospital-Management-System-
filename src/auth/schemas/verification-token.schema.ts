import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VerificationTokenDocument = HydratedDocument<VerificationToken>;

@Schema({ timestamps: true })
export class VerificationToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  tokenHash: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  usedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const VerificationTokenSchema =
  SchemaFactory.createForClass(VerificationToken);
