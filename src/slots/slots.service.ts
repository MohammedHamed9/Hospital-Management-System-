import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Slot, SlotStatus } from './slot-schema';
import { ClientSession, Model, Types } from 'mongoose';
import { CreateSlotDto } from './dtos/createSlotDto';

@Injectable()
export class SlotsService {
  constructor(
    @InjectModel('Slot')
    private readonly slotModel: Model<Slot>,
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

    return await newSlot.save();
  }

  async updateSlot(
    createSlotDto: CreateSlotDto,
    user: any,
    slotId: string,
  ): Promise<Slot> {
    const existingSlot = await this.slotModel.findById(slotId);
    if (!existingSlot) {
      throw new NotFoundException('Slot not found!');
    }

    if (existingSlot.doctorId.toString() !== user._id.toString()) {
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
    console.log('existingOverlappingSlot:', existingOverlappingSlot);
    if (existingOverlappingSlot) {
      throw new ConflictException(
        'Doctor already has an overlapping slot during this time period',
      );
    }

    existingSlot.date = slotDate;
    existingSlot.startTime = startDateTime;
    existingSlot.endTime = endDateTime;
    existingSlot.capacity = capacity;
    await existingSlot.save();
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
      throw new NotFoundException('Slot not found!');
    }

    return slot;
  }
  async getDoctorSlots(doctorId: string): Promise<Slot[]> {
    const doctorObjectId = new Types.ObjectId(doctorId);
    const slots = await this.slotModel
      .find({ doctorId: doctorObjectId, status: { $ne: SlotStatus.CANCELLED } })
      .populate('doctorId', '-_id name email address phone');

    if (!slots || slots.length === 0) {
      throw new NotFoundException('No slots found for this doctor');
    }
    return slots;
  }
  async cancelSlot(slotId: string, user: any): Promise<Slot> {
    const slot = await this.slotModel.findOne({
      _id: slotId,
      status: SlotStatus.AVAILABLE,
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }
    if (
      slot.doctorId.toString() !== user._id.toString() &&
      user.role == 'DOCTOR'
    ) {
      throw new ForbiddenException(
        'You are not authorized to cancel this slot',
      );
    }
    slot.status = SlotStatus.CANCELLED;
    return await slot.save();
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
      throw new BadRequestException('Slot is fully booked or not available.');
    }

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

    return updatedSlot;
  }
}
