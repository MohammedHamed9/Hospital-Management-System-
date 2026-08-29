import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { DoctorsModule } from './doctors/doctors.module';
import { ServicesModule } from './services/services.module';
import { ServicesBookingModule } from './services-booking/services-booking.module';
import { SlotsModule } from './slots/slots.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PrescriptionModule } from './prescriptions/prescriptions.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/hospital'),
    UsersModule,
    DoctorsModule,
    ServicesModule,
    ServicesBookingModule,
    SlotsModule,
    AppointmentsModule,
    PrescriptionModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
