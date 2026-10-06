import { forwardRef, Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceSchema } from './service-schema';
import { ServicesBookingModule } from 'src/services-booking/services-booking.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Service', schema: ServiceSchema }]),
    forwardRef(() => ServicesBookingModule),
  ],
  providers: [ServicesService],
  controllers: [ServicesController],
  exports: [ServicesService],
})
export class ServicesModule {}
