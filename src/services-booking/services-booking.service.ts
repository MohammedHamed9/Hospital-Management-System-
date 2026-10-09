import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { ServicesService } from 'src/services/services.service';
import { CreateServicesBookingDto } from './dtos/create-services-booking.dto';
import { ServicesBookingFilterDto } from './dtos/services-booking-filter.dto';
import { UpdateServicesBookingStatusDto } from './dtos/update-services-booking-status.dto';
import {
  ServicesBooking,
  ServicesBookingDocument,
  ServicesBookingStatus,
} from './services-booking-schema';

@Injectable()
export class ServicesBookingService {
  private readonly logger = new Logger(ServicesBookingService.name);

  constructor(
    @InjectModel('ServicesBooking')
    private readonly bookingModel: Model<ServicesBookingDocument>,
    @Inject(forwardRef(() => ServicesService))
    private readonly servicesService: ServicesService,
  ) {}

  async createBooking(
    userId: string,
    createDto: CreateServicesBookingDto,
  ): Promise<ServicesBookingDocument> {
    try {
      if (!Types.ObjectId.isValid(createDto.serviceId)) {
        this.logger.warn(
          `Invalid serviceId format: serviceId=${createDto.serviceId}`,
        );
        throw new BadRequestException('Invalid serviceId format');
      }
      const service = await this.servicesService.getServiceById(
        createDto.serviceId,
      );
      if (!service) {
        this.logger.warn(
          `Service retrieval failed — service not found: serviceId=${createDto.serviceId}`,
        );
        throw new NotFoundException('Service not found');
      }

      const newBooking = new this.bookingModel({
        userId: new Types.ObjectId(userId),
        serviceId: new Types.ObjectId(createDto.serviceId),
        date: new Date(),
        status: ServicesBookingStatus.PENDING,
      });

      const saved = await newBooking.save();
      this.logger.log(
        `Service booking created: bookingId=${saved._id}, userId=${userId}, serviceId=${createDto.serviceId}`,
      );
      this.logger.log(
        `Booking details: ${JSON.stringify({
          userId: saved.userId,
          serviceId: saved.serviceId,
          date: saved.date,
          status: saved.status,
        })}`,
      );
      return saved;
    } catch (error: any) {
      if (error.code === 11000) {
        this.logger.warn(
          `Duplicate booking attempt: userId=${userId}, serviceId=${createDto.serviceId}`,
        );
        throw new ConflictException(
          'You  already booked this service and its still pending ',
        );
      }
      throw error;
    }
  }

  async findAllBookings(filterDto: ServicesBookingFilterDto): Promise<{
    data: ServicesBookingDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (filterDto.status) {
      filter.status = filterDto.status;
    }

    const [data, total] = await Promise.all([
      this.bookingModel
        .find(filter)
        .populate('userId', 'name email phone')
        .populate('serviceId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.bookingModel.countDocuments(filter).exec(),
    ]);
    this.logger.log(
      `Retrieved bookings: page=${page}, limit=${limit}, total=${total}, filter=${JSON.stringify(
        filter,
      )}`,
    );
    return { data, total, page, limit };
  }

  async findUserBookings(userId: string): Promise<ServicesBookingDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      this.logger.warn(`Invalid userId format: userId=${userId}`);
      throw new BadRequestException('Invalid userId format');
    }

    this.logger.log(`Retrieving bookings for userId: ${userId}`);
    return await this.bookingModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('serviceId')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findBookingById(
    bookingId: string,
    user?: any,
  ): Promise<ServicesBookingDocument> {
    if (!Types.ObjectId.isValid(bookingId)) {
      this.logger.warn(`Invalid bookingId format: bookingId=${bookingId}`);
      throw new BadRequestException('Invalid bookingId format');
    }

    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('userId', 'name email phone')
      .populate('serviceId')
      .exec();

    if (!booking) {
      this.logger.warn(`Services booking not found: bookingId=${bookingId}`);
      throw new NotFoundException('Services booking not found');
    }

    if (user && user.role !== 'ADMIN') {
      const bookingUserId = (booking.userId as any)._id
        ? (booking.userId as any)._id.toString()
        : booking.userId.toString();
      if (bookingUserId !== user._id.toString() && bookingUserId !== user.id) {
        this.logger.warn(
          `Unauthorized access attempt: bookingId=${bookingId}, userId=${user._id}`,
        );
        throw new ForbiddenException(
          'You are not authorized to view this booking',
        );
      }
    }

    return booking;
  }

  async updateBookingStatus(
    bookingId: string,
    updateDto: UpdateServicesBookingStatusDto,
  ): Promise<ServicesBookingDocument> {
    if (!Types.ObjectId.isValid(bookingId)) {
      this.logger.warn(`Invalid bookingId format: bookingId=${bookingId}`);
      throw new BadRequestException('Invalid bookingId format');
    }

    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) {
      this.logger.warn(`Services booking not found: bookingId=${bookingId}`);
      throw new NotFoundException('Services booking not found');
    }

    if (booking.status === ServicesBookingStatus.CANCELLED) {
      this.logger.warn(
        `Cannot update status of a cancelled booking: bookingId=${bookingId}`,
      );
      throw new BadRequestException(
        'Cannot update status of a cancelled booking',
      );
    }

    if (booking.status === ServicesBookingStatus.COMPLETED) {
      this.logger.warn(
        `Cannot update status of a completed booking: bookingId=${bookingId}`,
      );
      throw new BadRequestException(
        'Cannot update status of a completed booking',
      );
    }

    booking.status = updateDto.status;
    return await booking.save();
  }

  async cancelBooking(
    bookingId: string,
    userId?: string,
  ): Promise<{ message: string; booking: ServicesBookingDocument }> {
    if (!Types.ObjectId.isValid(bookingId)) {
      this.logger.warn(`Invalid bookingId format: bookingId=${bookingId}`);
      throw new BadRequestException('Invalid bookingId format');
    }

    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) {
      this.logger.warn(`Services booking not found: bookingId=${bookingId}`);
      throw new NotFoundException('Services booking not found');
    }

    if (userId) {
      const bookingUserId = (booking.userId as any)._id
        ? (booking.userId as any)._id.toString()
        : booking.userId.toString();
      if (bookingUserId !== userId.toString()) {
        this.logger.warn(
          `Unauthorized access attempt: bookingId=${bookingId}, userId=${userId}`,
        );
        throw new ForbiddenException(
          'You are not authorized to cancel this booking',
        );
      }
    }

    if (booking.status === ServicesBookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    booking.status = ServicesBookingStatus.CANCELLED;
    await booking.save();
    this.logger.log(
      `Booking cancelled: bookingId=${bookingId}, by user=${userId || 'ADMIN'}`,
    );
    return {
      message: 'Booking cancelled successfully',
      booking,
    };
  }

  async cancelBookingsByUserId(
    userId: string,
    session: ClientSession,
  ): Promise<void> {
    this.logger.log(`Cancelling bookings for userId: ${userId}`);
    await this.bookingModel.updateMany(
      { userId, status: { $ne: ServicesBookingStatus.CANCELLED } },
      { $set: { status: ServicesBookingStatus.CANCELLED } },
      { session },
    );
  }
}
