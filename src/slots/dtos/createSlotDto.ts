import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  Min,
  IsDate,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SlotStatus } from '../slot-schema';

export class CreateSlotDto {
  @IsNotEmpty({ message: 'date is required' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsNotEmpty({ message: 'startTime is required' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime: string;

  @IsNotEmpty({ message: 'endTime is required' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime: string;

  @IsNotEmpty({ message: 'capacity is required' })
  @IsInt({ message: 'capacity must be an integer' })
  @Min(1, { message: 'capacity must be at least 1' })
  capacity: number;

  @IsOptional()
  @IsEnum(SlotStatus, { message: 'status must be a valid SlotStatus enum' })
  status?: SlotStatus;
}
