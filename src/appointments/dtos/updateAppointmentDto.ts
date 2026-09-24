import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from '../appointment-schema';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  slotId?: string;
}
