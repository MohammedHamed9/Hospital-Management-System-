import { SlotsService } from './../slots/slots.service';
import { UsersService } from './../users/users.service';
import { AppointmentsService } from './../appointments/appointments.service';
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { CreatePrescriptionDto } from './dtos/create-prescription.dto';
import { PrescriptionFilterDto } from './dtos/prescription-filter.dto';
import { UpdatePrescriptionDto } from './dtos/update-prescription.dto';
import {
  Prescription,
  PrescriptionDocument,
  PrescriptionStatus,
} from './prescription-schema';
import { UserRole } from '../users/user-schema';
@Injectable()
export class PrescriptionService {
  private readonly logger = new Logger(PrescriptionService.name);

  constructor(
    @InjectModel(Prescription.name)
    private readonly prescriptionModel: Model<PrescriptionDocument>,
    private readonly appointmentsService: AppointmentsService,
    @Inject(forwardRef(() => UsersService))
    private readonly UsersService: UsersService,
    private readonly slotsService: SlotsService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }
    return new Types.ObjectId(id);
  }

  async createPrescription(
    createDto: CreatePrescriptionDto,
    doctorId: string,
    user: any,
  ): Promise<PrescriptionDocument> {
    const doctorObjId = this.toObjectId(doctorId);
    const patientObjId = this.toObjectId(createDto.patientId);
    const appointmentObjId = this.toObjectId(createDto.appointmentId);

    const appointment = await this.appointmentsService.getAppointmentById(
      user,
      appointmentObjId.toString(),
    );
    if (!appointment) {
      this.logger.warn(
        `Appointment not found for appointmentId=${appointmentObjId}`,
      );
      throw new NotFoundException(
        'Invalid appointment, doctor, or patient combination.',
      );
    }
    if (
      appointment.patientId.id.toString() !== createDto.patientId.toString()
    ) {
      this.logger.warn(
        `Patient ID mismatch for appointmentId=${appointmentObjId}: expected ${appointment.patientId.id}, got ${createDto.patientId}`,
      );

      throw new NotFoundException(
        'Invalid  appointment, or patient combination.',
      );
    }

    const patient = await this.UsersService.findById(createDto.patientId);
    if (!patient) {
      this.logger.warn(
        `Patient not found for patientId=${createDto.patientId}`,
      );

      throw new NotFoundException('Invalid  doctor, or patient combination.');
    }

    const status = PrescriptionStatus.DRAFT;
    const oldPrescription = await this.prescriptionModel.findOne({
      patientId: patientObjId,
      appointmentId: appointmentObjId,
    });
    if (oldPrescription)
      throw new NotFoundException('this Prescription is already exists!');

    const createdPrescription = new this.prescriptionModel({
      ...createDto,
      doctorId: doctorObjId,
      patientId: patientObjId,
      appointmentId: appointmentObjId,
      status,
    });
    this.logger.log(
      `Prescription created: doctorId=${doctorId}, patientId=${createDto.patientId}, appointmentId=${createDto.appointmentId}`,
    );
    return await createdPrescription.save();
  }

  async updatePrescription(
    id: string,
    updateDto: UpdatePrescriptionDto,
    doctorId: string,
  ): Promise<PrescriptionDocument> {
    const prescriptionId = this.toObjectId(id);
    const prescription = await this.prescriptionModel.findById(prescriptionId);

    if (!prescription) {
      this.logger.warn(`Prescription not found for id=${id}`);
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.doctorId.toString() !== doctorId.toString()) {
      this.logger.warn(
        `Unauthorized update attempt for prescription id=${id} by doctorId=${doctorId}`,
      );
      throw new ForbiddenException(
        'You are not authorized to update this prescription',
      );
    }

    if (prescription.status === PrescriptionStatus.FINAL) {
      this.logger.warn(
        `Attempt to update finalized prescription id=${id} by doctorId=${doctorId}`,
      );
      throw new BadRequestException('Cannot update a finalized prescription');
    }

    const newStatus = updateDto.status || prescription.status;
    const items =
      updateDto.items !== undefined ? updateDto.items : prescription.items;

    if (newStatus === PrescriptionStatus.FINAL) {
      if (!items || items.length === 0) {
        this.logger.warn(
          `Attempt to finalize prescription id=${id} without items by doctorId=${doctorId}`,
        );
        throw new BadRequestException(
          'Cannot finalize a prescription without items',
        );
      }
      prescription.finalizedAt = new Date();
    }

    if (updateDto.patientId) {
      prescription.patientId = this.toObjectId(updateDto.patientId);
    }
    if (updateDto.appointmentId) {
      prescription.appointmentId = this.toObjectId(updateDto.appointmentId);
    }
    if (updateDto.status) {
      prescription.status = updateDto.status;
    }
    if (updateDto.notes !== undefined) {
      prescription.notes = updateDto.notes;
    }
    if (updateDto.items !== undefined) {
      prescription.items = updateDto.items as any;
    }
    this.logger.log(
      `Prescription updated: id=${id}, doctorId=${doctorId}, newStatus=${newStatus}`,
    );
    return await prescription.save();
  }

  async deletePrescription(
    id: string,
    doctorId: string,
  ): Promise<{ message: string }> {
    const prescriptionId = this.toObjectId(id);
    const prescription = await this.prescriptionModel.findById(prescriptionId);

    if (!prescription) {
      this.logger.warn(`Prescription not found for id=${id}`);
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.doctorId.toString() !== doctorId.toString()) {
      this.logger.warn(
        `Unauthorized delete attempt for prescription id=${id} by doctorId=${doctorId}`,
      );
      throw new ForbiddenException(
        'You are not authorized to delete this prescription',
      );
    }

    if (prescription.status === PrescriptionStatus.FINAL) {
      this.logger.warn(
        `Attempt to delete finalized prescription id=${id} by doctorId=${doctorId}`,
      );
      throw new BadRequestException('Cannot delete a finalized prescription');
    }

    this.logger.log(`Deleting prescription: id=${id}, doctorId=${doctorId}`);
    await this.prescriptionModel.findByIdAndDelete(prescriptionId);
    return { message: 'Prescription deleted successfully' };
  }

  async getPrescriptionById(
    id: string,
    user: any,
  ): Promise<PrescriptionDocument> {
    const prescriptionId = this.toObjectId(id);
    const prescription = await this.prescriptionModel
      .findOne({ _id: prescriptionId, status: PrescriptionStatus.FINAL })
      .populate('patientId', 'name email phone gender dateOfBirth')
      .populate('doctorId', 'name email phone address')
      .populate('appointmentId')
      .exec();

    if (!prescription) {
      this.logger.warn(`Prescription not found for id=${id}`);
      throw new NotFoundException('Prescription not found');
    }

    if (user.role === UserRole.PATIENT) {
      if (user.id.toString() !== prescription.patientId.toString()) {
        this.logger.warn(
          `Unauthorized access attempt for prescription id=${id} by patientId=${user.id}`,
        );
        throw new ForbiddenException(
          'You are not authorized to view this prescription',
        );
      }
    }
    this.logger.log(
      `Prescription retrieved: id=${id}, accessed by userId=${user.id}`,
    );
    return prescription;
  }

  async getPatientPrescriptionsForMedicalRecord(
    patientId: string,
  ): Promise<any[]> {
    return await this.prescriptionModel
      .find({
        patientId: this.toObjectId(patientId),
      })
      .sort({ createdAt: -1 })
      .populate('doctorId', 'name email phone address')
      .populate('appointmentId')
      .lean()
      .exec();
    this.logger.log(
      `Retrieved prescriptions for patientId=${patientId} for medical record`,
    );
  }

  async getPrescriptions(
    filterDto?: PrescriptionFilterDto,
    user?: any,
  ): Promise<{
    data: PrescriptionDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filter: any = {};

    if (user.role === UserRole.PATIENT) {
      filter.patientId = this.toObjectId(user._id);
      filter.status = PrescriptionStatus.FINAL;
    } else if (user.role === UserRole.DOCTOR) {
      filter.doctorId = this.toObjectId(user._id);

      if (filterDto?.patientId) {
        filter.patientId = this.toObjectId(filterDto.patientId);
      }
      if (filterDto?.status) {
        filter.status = filterDto.status;
      }
    } else if (user.role === UserRole.ADMIN) {
      if (filterDto?.patientId) {
        filter.patientId = this.toObjectId(filterDto.patientId);
      }
      if (filterDto?.doctorId) {
        filter.doctorId = this.toObjectId(filterDto.doctorId);
      }
      if (filterDto?.status) {
        filter.status = filterDto.status;
      }
    }

    if (filterDto?.startDate || filterDto?.endDate) {
      filter.createdAt = {};
      if (filterDto.startDate) {
        filter.createdAt.$gte = new Date(filterDto.startDate);
      }
      if (filterDto.endDate) {
        filter.createdAt.$lte = new Date(filterDto.endDate);
      }
    }

    const page = Math.max(1, filterDto?.page || 1);
    const limit = Math.max(1, filterDto?.limit || 10);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prescriptionModel
        .find(filter)
        .populate('doctorId', 'name email phone')
        .populate('patientId', 'name email phone')
        .populate('appointmentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.prescriptionModel.countDocuments(filter).exec(),
    ]);
    this.logger.log(
      `Retrieved prescriptions: userId=${user._id}, role=${user.role}, filter=${JSON.stringify(
        filterDto,
      )}, total=${total}`,
    );
    return { data, total, page, limit };
  }

  async getDoctorPrescriptions(
    doctorId: string,
    user: any,
    filterDto?: PrescriptionFilterDto,
  ): Promise<{
    data: PrescriptionDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    if (user.role === UserRole.DOCTOR) {
      if (user._id.toString() !== doctorId) {
        this.logger.warn(
          `Unauthorized access attempt for doctor prescriptions by userId=${user._id}, doctorId=${doctorId}`,
        );
        throw new UnauthorizedException('this is not your Prescriptions!');
      }
    }
    const doctorObjId = this.toObjectId(doctorId);
    const filter: any = { doctorId: doctorObjId };
    if (filterDto?.patientId) {
      filter.patientId = this.toObjectId(filterDto.patientId);
    }
    if (filterDto?.status) {
      filter.status = filterDto.status;
    }
    if (filterDto?.startDate || filterDto?.endDate) {
      filter.createdAt = {};
      if (filterDto.startDate) {
        filter.createdAt.$gte = new Date(filterDto.startDate);
      }
      if (filterDto.endDate) {
        filter.createdAt.$lte = new Date(filterDto.endDate);
      }
    }

    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prescriptionModel
        .find(filter)
        .populate('patientId', 'name email phone gender')
        .populate('appointmentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.prescriptionModel.countDocuments(filter).exec(),
    ]);
    this.logger.log(
      `Retrieved doctor prescriptions: doctorId=${doctorId}, userId=${user._id}, filter=${JSON.stringify(
        filterDto,
      )}, total=${total}`,
    );
    return { data, total, page, limit };
  }

  async finalizePrescription(
    id: string,
    user: any,
  ): Promise<PrescriptionDocument> {
    const doctorId = this.toObjectId(user._id);
    const prescriptionId = this.toObjectId(id);

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const prescription = await this.prescriptionModel
        .findById(prescriptionId)
        .session(session);

      if (!prescription) {
        this.logger.warn(`Prescription not found for id=${id}`);
        throw new NotFoundException('Prescription not found');
      }

      if (prescription.doctorId.toString() !== doctorId.toString()) {
        this.logger.warn(
          `not allwoed doctor to finilize the presciption with id=${id} by doctorId=${doctorId}`,
        );
        throw new ForbiddenException(
          'You are not authorized to finalize this prescription',
        );
      }

      if (prescription.status === PrescriptionStatus.FINAL) {
        this.logger.warn(
          `Attempt to finalize already finalized prescription id=${id} by doctorId=${doctorId}`,
        );
        throw new BadRequestException('Prescription is already finalized');
      }

      if (!prescription.items || prescription.items.length === 0) {
        this.logger.warn(
          `Attempt to finalize prescription id=${id} without items by doctorId=${doctorId}`,
        );
        throw new BadRequestException(
          'Cannot finalize a prescription without items',
        );
      }

      const appointment = await this.appointmentsService.getAppointmentById(
        user,
        prescription.appointmentId.toString(),
      );

      prescription.status = PrescriptionStatus.FINAL;
      prescription.finalizedAt = new Date();
      await prescription.save({ session });

      await this.appointmentsService.markAsCompleted(
        prescription.appointmentId.toString(),
        session,
      );

      const slotId = appointment.slotId?._id
        ? appointment.slotId._id.toString()
        : appointment.slotId.toString();
      this.logger.debug(
        `Finalizing prescription id=${id}: decrementing waiting list for slotId=${slotId}`,
      );
      await this.slotsService.decrementWaitingList(slotId, session);

      await session.commitTransaction();
      this.logger.log(`Prescription finalized: id=${id}, doctorId=${user._id}`);
      return prescription;
    } catch (error) {
      this.logger.error(
        `Failed to finalize prescription id=${id}`,
        error.stack,
      );
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
