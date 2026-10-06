import { forwardRef, Module } from '@nestjs/common';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SlotSchema } from './slot-schema';
import { DoctorsModule } from 'src/doctors/doctors.module';
import { AppointmentsModule } from 'src/appointments/appointments.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Slot', schema: SlotSchema }]),
    DoctorsModule,
    forwardRef(() => AppointmentsModule),
  ],
  controllers: [SlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
