import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentSchema } from './appointment-schema';
import { DoctorsModule } from 'src/doctors/doctors.module';
import { UsersModule } from 'src/users/users.module';
import { SlotsModule } from 'src/slots/slots.module';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Appointment', schema: AppointmentSchema },
    ]),
    DoctorsModule,
    UsersModule,
    SlotsModule,
    ServicesModule,
  ],
  providers: [AppointmentsService],
  controllers: [AppointmentsController],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
