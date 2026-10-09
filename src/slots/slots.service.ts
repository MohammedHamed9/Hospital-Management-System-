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
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Slot, SlotStatus } from './slot-schema';
import { ClientSession, Model, Types, Connection } from 'mongoose';
import { CreateSlotDto } from './dtos/createSlotDto';
import { AppointmentsService } from 'src/appointments/appointments.service';
import { UserRole } from 'src/users/user-schema';

@Injectable()
export class SlotsService {
  private readonly logger = new Logger(SlotsService.name);

  constructor(
    @InjectModel('Slot')
    private readonly slotModel: Model<Slot>,
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointmentsService: AppointmentsService,
    @InjectConnection() private readonly connection: Connection,
  ) {}
  private constructDateTime(dateStr: string, timeStr: string): Date {
    const parsedDate = new Date(`${dateStr}T${timeStr}:00.000Z`);

    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException(
        `Invalid date/time format: ${dateStr} ${timeStr}`,
      );
    }

    return parsedDate;
  }
  async addSlot(createSlotDto: CreateSlotDto, user): Promise<Slot> {
    const { date, startTime, endTime, capacity } = createSlotDto;

    const slotDate = new Date(`${date}T00:00:00.000Z`);
    const startDateTime = this.constructDateTime(date, startTime);
    const endDateTime = this.constructDateTime(date, endTime);
    if (endDateTime <= startDateTime) {
      this.logger.warn(
        `Invalid slot time range: startTime=${startTime}, endTime=${endTime}`,
      );
      throw new BadRequestException('endTime must be strictly after startTime');
    }
    const existingOverlappingSlot = await this.slotModel.findOne({
      doctorId: user._id,
      status: { $ne: SlotStatus.CANCELLED },
      $and: [
        { startTime: { $lt: endDateTime } },
        { endTime: { $gt: startDateTime } },
      ],
    });
    if (existingOverlappingSlot) {
      this.logger.warn(
        `Overlapping slot detected for doctorId=${user._id}: existingSlotId=${existingOverlappingSlot._id}`,
      );
      throw new ConflictException(
        'Doctor already has an overlapping slot during this time period',
      );
    }
    const newSlot = new this.slotModel({
      doctorId: user._id,
      date: slotDate,
      startTime: startDateTime,
      endTime: endDateTime,
      capacity,
    });
    this.logger.log(
      `Creating new slot for doctorId=${user._id}: date=${date}, startTime=${startTime}, endTime=${endTime}, capacity=${capacity}`,
    );
    return await newSlot.save();
  }

  async updateSlot(
    createSlotDto: CreateSlotDto,
    user: any,
    slotId: string,
  ): Promise<Slot> {
    const existingSlot = await this.slotModel.findById(slotId);
    if (!existingSlot) {
      this.logger.warn(`Slot not found for update: slotId=${slotId}`);
      throw new NotFoundException('Slot not found!');
    }

    if (existingSlot.doctorId.toString() !== user._id.toString()) {
      this.logger.warn(
        `Unauthorized slot update attempt: slotId=${slotId}, userId=${user._id}`,
      );
      throw new ForbiddenException(
        'You are not authorized to update this slot',
      );
    }

    const { date, startTime, endTime, capacity } = createSlotDto;

    const slotDate = new Date(`${date}T00:00:00.000Z`);
    const startDateTime = this.constructDateTime(date, startTime);
    const endDateTime = this.constructDateTime(date, endTime);
    if (endDateTime <= startDateTime) {
      throw new BadRequestException('endTime must be strictly after startTime');
    }
    const existingOverlappingSlot = await this.slotModel.findOne({
      _id: { $ne: slotId },
      doctorId: user._id,
      status: { $ne: SlotStatus.CANCELLED },
      startTime: { $lt: endDateTime },
      endTime: { $gt: startDateTime },
    });
    this.logger.debug(
      `Overlapping slot check for slot=${slotId}: ${existingOverlappingSlot ? 'found' : 'none'}`,
    );
    if (existingOverlappingSlot) {
      this.logger.warn(
        `Overlapping slot detected for doctorId=${user._id}: existingSlotId=${existingOverlappingSlot._id}`,
      );
      throw new ConflictException(
        'Doctor already has an overlapping slot during this time period',
      );
    }

    existingSlot.date = slotDate;
    existingSlot.startTime = startDateTime;
    existingSlot.endTime = endDateTime;
    existingSlot.capacity = capacity;
    await existingSlot.save();
    this.logger.log(
      `Slot updated successfully: slotId=${slotId}, doctorId=${user._id}`,
    );
    return existingSlot;
  }
  async getSlot(slotId: string, sessoin?: ClientSession): Promise<Slot> {
    const query = this.slotModel.findOne({
      _id: slotId,
      status: SlotStatus.AVAILABLE,
    });
    if (sessoin) query.session(sessoin);

    const slot = await query
      .populate('doctorId', '_id name email address phone')
      .exec();
    if (!slot) {
      this.logger.warn(`Slot not found: slotId=${slotId}`);
      throw new NotFoundException('Slot not found!');
    }
    this.logger.log(`Slot retrieved successfully: slotId=${slotId}`);
    return slot;
  }
  async getDoctorSlots(doctorId: string): Promise<Slot[]> {
    const doctorObjectId = new Types.ObjectId(doctorId);
    const slots = await this.slotModel
      .find({ doctorId: doctorObjectId, status: { $ne: SlotStatus.CANCELLED } })
      .populate('doctorId', '-_id name email address phone');

    if (!slots || slots.length === 0) {
      this.logger.warn(`No slots found for doctorId=${doctorId}`);
      throw new NotFoundException('No slots found for this doctor');
    }
    this.logger.log(
      `Slots retrieved successfully for doctorId=${doctorId}: count=${slots.length}`,
    );
    return slots;
  }
  async cancelSlot(slotId: string, user: any): Promise<Slot> {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const slot = await this.slotModel.findById(slotId);
      if (!slot) {
        this.logger.warn(`Slot not found: slotId=${slotId}`);
        throw new NotFoundException('Slot not found');
      }
      if (
        slot.doctorId.toString() !== user._id.toString() &&
        user.role == UserRole.DOCTOR
      ) {
        this.logger.warn(
          `Unauthorized slot cancellation attempt: slotId=${slotId}, userId=${user._id}`,
        );
        throw new ForbiddenException(
          'You are not authorized to cancel this slot',
        );
      }

      const updatedSlot = await this.slotModel.findOneAndUpdate(
        { _id: slotId, status: SlotStatus.AVAILABLE },
        { status: SlotStatus.CANCELLED },
        { new: true, session },
      );
      if (!updatedSlot) {
        this.logger.warn(
          `Slot cannot be cancelled: slotId=${slotId} is not in AVAILABLE status`,
        );
        throw new BadRequestException(
          'Slot cannot be cancelled because it is not in AVAILABLE status',
        );
      }
      await this.appointmentsService.cancelAppointmentsBySlotId(
        slotId,
        session,
      );
      await session.commitTransaction();
      this.logger.log(`Slot cancelled: slotId=${slotId}, by user=${user._id}`);
      return updatedSlot;
    } catch (error) {
      this.logger.error(`Failed to cancel slot: slotId=${slotId}`, error.stack);
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
  async incrementWaitingList(slotId: string, session?: ClientSession) {
    const updatedSlot = await this.slotModel.findOneAndUpdate(
      {
        _id: slotId,
        status: SlotStatus.AVAILABLE,
        $expr: {
          $lt: ['$waitingList', '$capacity'],
        },
      },
      [
        {
          $set: {
            waitingList: { $add: ['$waitingList', 1] },
            status: {
              $cond: {
                if: { $eq: [{ $add: ['$waitingList', 1] }, '$capacity'] },
                then: SlotStatus.FULLOFF,
                else: '$status',
              },
            },
          },
        },
      ],
      {
        new: true,
        session,
        updatePipeline: true,
      },
    );

    if (!updatedSlot) {
      this.logger.warn(
        `Cannot increment waiting list: slotId=${slotId} is either fully booked or not available`,
      );
      throw new BadRequestException('Slot is fully booked or not available.');
    }
    this.logger.log(
      `Waiting list incremented for slotId=${slotId}: new waitingList=${updatedSlot.waitingList}`,
    );
    return updatedSlot;
  }
  async decrementWaitingList(slotId: string, session?: ClientSession) {
    const updatedSlot = await this.slotModel.findOneAndUpdate(
      {
        _id: slotId,
        waitingList: { $gt: 0 },
      },
      [
        {
          $set: {
            waitingList: { $subtract: ['$waitingList', 1] },
            status: {
              $cond: {
                if: { $eq: [{ $subtract: ['$waitingList', 1] }, 0] },
                then: SlotStatus.AVAILABLE,
                else: '$status',
              },
            },
          },
        },
      ],
      {
        new: true,
        session,
        updatePipeline: true,
      },
    );

    if (!updatedSlot) {
      throw new BadRequestException(
        'Slot waiting list is already 0 or slot not found.',
      );
    }
    this.logger.log(
      `Waiting list decremented for slotId=${slotId}: new waitingList=${updatedSlot.waitingList}`,
    );
    return updatedSlot;
  }
  async cancelSlotsByDoctorId(
    doctorObjectId: any,
    session?: ClientSession,
  ): Promise<void> {
    this.logger.log(
      `Cancelling all slots for doctorId=${doctorObjectId} that are not already cancelled`,
    );
    await this.slotModel.updateMany(
      { doctorId: doctorObjectId, status: { $ne: SlotStatus.CANCELLED } },
      { $set: { status: SlotStatus.CANCELLED } },
      { session },
    );
  }
}
