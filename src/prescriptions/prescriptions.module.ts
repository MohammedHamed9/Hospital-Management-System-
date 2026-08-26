import { PrescriptionSchema } from './prescription-schema';
import { Module } from '@nestjs/common';
import { PrescriptionController } from './prescriptions.controller';
import { PrescriptionService } from './prescriptions.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import { AppointmentsModule } from 'src/appointments/appointments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Prescription', schema: PrescriptionSchema },
    ]),
    UsersModule,
    AppointmentsModule,
  ],
  controllers: [PrescriptionController],
  providers: [PrescriptionService],
})
export class PrescriptionModule {}
