import { Module } from '@nestjs/common';
import { ServicesBookingController } from './services-booking.controller';
import { ServicesBookingService } from './services-booking.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesBookingSchema } from './services-booking-schema';
import { UsersModule } from 'src/users/users.module';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ServicesBooking', schema: ServicesBookingSchema },
    ]),
    UsersModule,
    ServicesModule,
  ],
  controllers: [ServicesBookingController],
  providers: [ServicesBookingService],
})
export class ServicesBookingModule {}
