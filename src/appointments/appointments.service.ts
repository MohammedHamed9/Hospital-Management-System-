import { DoctorsService } from './../doctors/doctors.service';
import { UpdateAppointmentDto } from './dtos/updateAppointmentDto';
import { UsersService } from './../users/users.service';
import { SlotsService } from './../slots/slots.service';
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
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
} from './appointment-schema';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { UserRole } from 'src/users/user-schema';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,
    private readonly slotsService: SlotsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly doctorsService: DoctorsService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async addAppointmet(
    patientId: string,
    slotId: string,
    user: any,
  ): Promise<Appointment | undefined> {
    let finalPatientId = user._id.toString();
    if (user.role == 'ADMIN' || user.role == 'DOCTOR') {
      if (!patientId) {
        this.logger.warn(
          `Appointment booking failed — patientId is required for user role: ${user.role}`,
        );
        throw new BadRequestException('patientId is required');
      }
      const patient = await this.usersService.findById(patientId);
      if (!patient || patient.role !== 'PATIENT') {
        this.logger.warn(
          `Appointment booking failed — patient not found or invalid role: patientId=${patientId}`,
        );
        throw new NotFoundException('Sorry this user is not exist!');
      }
      finalPatientId = patientId;
    }
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      if (!slotId) {
        this.logger.warn(
          `Appointment booking failed — slotId is required for userId=${finalPatientId}`,
        );
        throw new BadRequestException('slotId is required');
      }
      const slot = await this.slotsService.getSlot(slotId, session);

      const existingAppointment = await this.appointmentModel
        .findOne({
          patientId: finalPatientId,
          slotId,
          status: { $ne: AppointmentStatus.CANCELLED },
        })
        .session(session);
      if (existingAppointment) {
        this.logger.warn(
          `Appointment booking conflict — patientId=${finalPatientId} has already booked slotId=${slotId}`,
        );
        throw new ConflictException('You have already booked this slot');
      }

      const [appointment] = await this.appointmentModel.create(
        [
          {
            slotId,
            doctorId: slot.doctorId,
            patientId: finalPatientId,
          },
        ],
        { session },
      );
      const updatedSlot = await this.slotsService.incrementWaitingList(
        slotId,
        session,
      );
      if (!updatedSlot) {
        this.logger.warn(
          `Appointment booking failed — slot is fully booked: slotId=${slotId}`,
        );
        throw new ConflictException('Slot is fully booked');
      }
      await session.commitTransaction();

      this.logger.log(
        `Appointment booked: patient=${finalPatientId}, slot=${slotId}, id=${appointment._id}`,
      );
      return appointment;
    } catch (error) {
      this.logger.error(
        `Failed to book appointment: patient=${finalPatientId}, slot=${slotId}`,
        error.stack,
      );
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async cancelAppointmet(
    appointmentId: string,
    user: any,
  ): Promise<{ message: string }> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const existingAppointment = await this.appointmentModel
        .findOne({
          _id: appointmentId,
          status: { $ne: AppointmentStatus.CANCELLED },
        })
        .session(session);

      if (!existingAppointment) {
        this.logger.warn(
          `Appointment cancellation failed — appointment not found or already cancelled: appointmentId=${appointmentId}`,
        );
        throw new NotFoundException('The appointment is not found!');
      }

      if (user.role === 'PATIENT') {
        if (existingAppointment.patientId.toString() !== user._id.toString()) {
          this.logger.warn(
            `Unauthorized appointment cancellation attempt — userId=${user._id} is not the owner of appointmentId=${appointmentId}`,
          );
          throw new ForbiddenException(
            'Sorry you are not allowed to do this process!',
          );
        }
      }

      existingAppointment.status = AppointmentStatus.CANCELLED;
      await existingAppointment.save({ session });

      await this.slotsService.decrementWaitingList(
        existingAppointment.slotId.toString(),
        session,
      );

      await session.commitTransaction();

      this.logger.log(
        `Appointment cancelled: id=${appointmentId}, by user=${user._id} (role=${user.role})`,
      );
      return { message: 'The appointment is canceled successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to cancel appointment: id=${appointmentId}`,
        error.stack,
      );
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getMyAppointments(
    user: any,
  ): Promise<{ appointments: Appointment[]; total: number }> {
    const filter = {
      ...(user.role === 'DOCTOR'
        ? { doctorId: new Types.ObjectId(user._id) }
        : { patientId: new Types.ObjectId(user._id) }),
      status: {
        $in: [AppointmentStatus.PENDING, AppointmentStatus.COMPLETED],
      },
    };

    const [appointments, total] = await Promise.all([
      this.appointmentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .populate('patientId', 'name email')
        .populate(
          'slotId',
          'startTime endTime date capacity waitingList status',
        )
        .lean<Appointment[]>(),
      this.appointmentModel.countDocuments(filter),
    ]);
    this.logger.log(
      `Retrieved ${appointments.length} appointments for userId=${user._id} (role=${user.role})`,
    );
    return { appointments, total };
  }

  async getAppointmentById(
    user: any,
    appointmentId: string,
  ): Promise<Appointment> {
    const appointment = await this.appointmentModel
      .findById(appointmentId)
      .populate('patientId', 'name email ')
      .populate('slotId', 'startTime endTime date capacity waitingList status');
    if (!appointment) {
      this.logger.warn(
        `Appointment retrieval failed — appointment not found: appointmentId=${appointmentId}`,
      );
      throw new NotFoundException('this appointment is not found!');
    }
    if (user.role === 'PATIENT') {
      if (appointment.patientId._id.toString() !== user._id.toString()) {
        this.logger.warn(
          `Unauthorized appointment access attempt — userId=${user._id} is not the owner of appointmentId=${appointmentId}`,
        );
        throw new ForbiddenException('sorry this appointment is not yours!');
      }
    }
    return appointment;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    const appointments = await this.appointmentModel
      .find({})
      .sort({ createdAt: -1 })
      .lean<Appointment[]>()
      .populate('patientId', 'name email ')
      .populate('slotId', 'startTime endTime date capacity waitingList status');
    this.logger.log(
      `Retrieved all appointments, total count: ${appointments.length}`,
    );
    return appointments;
  }

  async getSlotAppointments(
    slotId: string,
    user?: any,
  ): Promise<Appointment[]> {
    if (!Types.ObjectId.isValid(slotId)) {
      throw new BadRequestException('Invalid slotId format');
    }

    const slot = await this.slotsService.getSlot(slotId);
    if (!slot) {
      this.logger.warn(
        `Slot retrieval failed — slot not found: slotId=${slotId}`,
      );
      throw new NotFoundException('Slot not found!');
    }

    const appointments = await this.appointmentModel
      .find({ slotId: new Types.ObjectId(slotId) })
      .sort({ createdAt: -1 })
      .populate('patientId', 'name email phone gender')
      .populate('doctorId', 'name email specialization')
      .populate('slotId', 'startTime endTime date capacity waitingList status')
      .lean<Appointment[]>()
      .exec();

    this.logger.log(
      `Retrieved ${appointments.length} appointments for slotId=${slotId}`,
    );
    return appointments;
  }

  async getCompletedAppointmentsByPatientId(patientId: string): Promise<any[]> {
    this.logger.log(
      `Fetching completed appointments for patientId=${patientId}`,
    );
    return await this.appointmentModel
      .find({
        patientId: new Types.ObjectId(patientId),
        status: AppointmentStatus.COMPLETED,
      })
      .sort({ createdAt: -1 })
      .populate('doctorId', 'name email phone specialization')
      .populate('slotId', 'date startTime endTime capacity waitingList status')
      .lean()
      .exec();
  }

  async getAppointmentStats(): Promise<{
    todayAppointments: number;
    pendingAppointments: number;
    completedAppointments: number;
  }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [todayAppointments, pendingAppointments, completedAppointments] =
      await Promise.all([
        this.appointmentModel.countDocuments({
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        }),
        this.appointmentModel.countDocuments({
          status: AppointmentStatus.PENDING,
        }),
        this.appointmentModel.countDocuments({
          status: AppointmentStatus.COMPLETED,
        }),
      ]);
    this.logger.log(
      `Appointment stats retrieved: today=${todayAppointments}, pending=${pendingAppointments}, completed=${completedAppointments}`,
    );
    return {
      todayAppointments,
      pendingAppointments,
      completedAppointments,
    };
  }

  async updateAppointment(
    updateAppointmentDto: UpdateAppointmentDto,
    appointmentId: string,
  ): Promise<Appointment> {
    if (updateAppointmentDto.status == AppointmentStatus.CANCELLED) {
      this.logger.warn(
        `Attempt to update appointment status to CANCELLED via updateAppointment method: appointmentId=${appointmentId}`,
      );
      throw new ConflictException(
        'this route is not for canceling the appointment please go to the right one',
      );
    }

    if (updateAppointmentDto.doctorId) {
      const doctor = await this.doctorsService.getDoctorById(
        updateAppointmentDto.doctorId,
      );
      if (!doctor) {
        this.logger.warn(
          `Doctor retrieval failed — doctor not found: doctorId=${updateAppointmentDto.doctorId}`,
        );
        throw new NotFoundException('this doctor is not found!');
      }
    }
    if (updateAppointmentDto.slotId) {
      const slot = await this.slotsService.getSlot(updateAppointmentDto.slotId);
      if (!slot) {
        this.logger.warn(
          `Slot retrieval failed — slot not found: slotId=${updateAppointmentDto.slotId}`,
        );
        throw new NotFoundException('this slot is not found!');
      }
    }
    const appointment = await this.appointmentModel.findByIdAndUpdate(
      appointmentId,
      updateAppointmentDto,
      { new: true },
    );
    if (!appointment) {
      this.logger.warn(
        `Appointment update failed — appointment not found: appointmentId=${appointmentId}`,
      );
      throw new NotFoundException(
        `Appointment with ID ${appointmentId} not found`,
      );
    }
    this.logger.log(
      `Appointment updated: appointmentId=${appointmentId}, updates=${JSON.stringify(
        updateAppointmentDto,
      )}`,
    );
    return appointment;
  }

  async markAsCompleted(
    appointmentId: string,
    session?: ClientSession,
  ): Promise<AppointmentDocument> {
    const updatedAppointment = await this.appointmentModel.findByIdAndUpdate(
      appointmentId,
      { status: AppointmentStatus.COMPLETED },
      { new: true, session },
    );

    if (!updatedAppointment) {
      this.logger.warn(
        `Appointment update failed — appointment not found: appointmentId=${appointmentId}`,
      );
      throw new NotFoundException('Appointment not found!');
    }
    this.logger.log(
      `Appointment marked as completed: appointmentId=${appointmentId}`,
    );
    return updatedAppointment;
  }

  async cancelAppointmentsByUserId(
    doctorObjectId: any,
    role: UserRole,
    session?: ClientSession,
  ): Promise<void> {
    if (role === UserRole.DOCTOR) {
      this.logger.log(`Cancelling appointments for doctorId=${doctorObjectId}`);
      await this.appointmentModel.updateMany(
        {
          doctorId: doctorObjectId,
          status: { $ne: AppointmentStatus.CANCELLED },
        },
        { status: AppointmentStatus.CANCELLED },
        { session },
      );
    } else {
      this.logger.log(
        `Cancelling appointments for patientId=${doctorObjectId}`,
      );
      await this.appointmentModel.updateMany(
        {
          patientId: doctorObjectId,
          status: { $ne: AppointmentStatus.CANCELLED },
        },
        { status: AppointmentStatus.CANCELLED },
        { session },
      );
    }
  }

  async cancelAppointmentsBySlotId(
    slotId: string,
    session?: ClientSession,
  ): Promise<void> {
    this.logger.log(`Cancelling appointments for slotId=${slotId}`);
    await this.appointmentModel.updateMany(
      { slotId, status: { $ne: AppointmentStatus.CANCELLED } },
      { status: AppointmentStatus.CANCELLED },
      { session },
    );
  }
}
