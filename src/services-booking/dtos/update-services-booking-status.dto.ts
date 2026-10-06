import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ServicesBookingStatus } from '../services-booking-schema';

export class UpdateServicesBookingStatusDto {
  @ApiProperty({
    enum: ServicesBookingStatus,
    example: ServicesBookingStatus.COMPLETED,
    description: 'Updated booking status',
  })
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(ServicesBookingStatus, { message: 'Invalid booking status' })
  status: ServicesBookingStatus;
}
