import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateServicesBookingDto {
  @ApiProperty({
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
    description: 'ID of the medical service to book',
  })
  @IsNotEmpty({ message: 'serviceId is required' })
  @IsString({ message: 'serviceId must be a string' })
  serviceId: string;
}
