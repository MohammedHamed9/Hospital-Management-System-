import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from '../appointment-schema';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({
    enum: AppointmentStatus,
    example: AppointmentStatus.COMPLETED,
    description: 'Updated appointment status',
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
    description: 'ID of assigned doctor',
  })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({
    example: '65f1a2b3c4d5e6f7a8b9c0d2',
    description: 'ID of assigned slot',
  })
  @IsOptional()
  @IsString()
  slotId?: string;
}
