import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './user-schema';
import { AuthModule } from 'src/auth/auth.module';
import { AppointmentsModule } from 'src/appointments/appointments.module';
import { DoctorsModule } from 'src/doctors/doctors.module';
import { SlotsModule } from 'src/slots/slots.module';
import { ServicesBookingModule } from 'src/services-booking/services-booking.module';
import { PrescriptionModule } from 'src/prescriptions/prescriptions.module';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    forwardRef(() => AuthModule),
    forwardRef(() => AppointmentsModule),
    forwardRef(() => DoctorsModule),
    forwardRef(() => SlotsModule),
    forwardRef(() => ServicesBookingModule),
    forwardRef(() => PrescriptionModule),
    forwardRef(() => ServicesModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
