import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Slot, SlotStatus } from './slot-schema';
import { Model, Types } from 'mongoose';
import { CreateSlotDto } from './dtos/createSlotDto';
import { UpdateSlotDto } from './dtos/updateSlotDto';

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
  /*
  async updateSlot(
    updateSlotDto: UpdateSlotDto,
    user: any,
    slotId: string,
  ): Promise<Slot> {
    // 1. جلب الموعد الحالي من قاعدة البيانات
    const existingSlot = await this.slotModel.findById(slotId);
    if (!existingSlot) {
      throw new NotFoundException('Slot not found');
    }

    // 2. التحقق من الملكية والصلاحيات
    if (existingSlot.doctorId.toString() !== user._id.toString()) {
      throw new ForbiddenException(
        'You are not authorized to update this slot',
      );
    }

    const { date, startTime, endTime, capacity, status } = updateSlotDto;
    let newStartTime;
    let newEndTime;
    let newDate;
    if (date || startTime || endTime) {
      newDate = date ? new Date(`${date}T00:00:00.000Z`) : existingSlot.date;
      newStartTime = startTime
        ? this.constructDateTime(
            date || existingSlot.date.toISOString().split('T')[0],
            startTime,
          )
        : existingSlot.startTime;
      newEndTime = endTime
        ? this.constructDateTime(
            date || existingSlot.date.toISOString().split('T')[0],
            endTime,
          )
        : existingSlot.endTime;
    }
    if (endTime && startTime && newEndTime <= newStartTime) {
      throw new BadRequestException('endTime must be strictly after startTime');
    }
    const updatedSlot = await this.slotModel.findOneAndUpdate(
      { _id: slotId },
      {

      },
      { new: true },
    );
    return updatedSlot;
  }*/
  async getSlot(slotId: string): Promise<Slot> {
    const slot = await this.slotModel
      .findById(slotId)
      .populate('doctorId', '-_id name email address phone');
    if (!slot) {
      throw new NotFoundException('Slot not found');
    }
    return slot;
  }
  async getDoctorSlots(doctorId: string): Promise<Slot[]> {
    console.log('Fetching slots for doctorId:', doctorId);
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
}
