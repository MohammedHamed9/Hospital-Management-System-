import { SlotsModule } from './../slots/slots.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Prescription, PrescriptionSchema } from './prescription-schema';
import { PrescriptionController } from './prescriptions.controller';
import { PrescriptionService } from './prescriptions.service';
import { AppointmentsModule } from 'src/appointments/appointments.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Prescription.name, schema: PrescriptionSchema },
    ]),
    AppointmentsModule,
    UsersModule,
    SlotsModule,
  ],
  controllers: [PrescriptionController],
  providers: [PrescriptionService],
  exports: [PrescriptionService],
})
export class PrescriptionModule {}
