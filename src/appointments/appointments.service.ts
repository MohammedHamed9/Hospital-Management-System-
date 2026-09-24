import { DoctorsService } from './../doctors/doctors.service';
import { UpdateAppointmentDto } from './dtos/updateAppointmentDto';
import { UsersService } from './../users/users.service';
import { SlotsService } from './../slots/slots.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
} from './appointment-schema';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,
    private readonly slotsService: SlotsService,
    private readonly usersService: UsersService,
    private readonly doctorsService: DoctorsService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async addAppointmet(
    patientId: string,
    slotId: string,
    user: any,
  ): Promise<Appointment | undefined> {
    //if Admin or doctor check on pateint id
    let finalPatientId = user._id.toString();
    if (user.role == 'ADMIN' || user.role == 'DOCTOR') {
      if (!patientId) throw new BadRequestException('patientId is required');
      const patient = await this.usersService.findById(patientId);
      if (!patient || patient.role !== 'PATIENT')
        throw new NotFoundException('Sorry this user is not exist!');
      finalPatientId = patientId;
    }
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      //no slotId
      if (!slotId) throw new BadRequestException('slotId is required');
      const slot = await this.slotsService.getSlot(slotId, session);

      const existingAppointment = await this.appointmentModel
        .findOne({
          patientId: finalPatientId,
          slotId,
          status: { $ne: AppointmentStatus.CANCELLED },
        })
        .session(session);
      if (existingAppointment) {
        throw new ConflictException('You have already booked this slot');
      }
      //create app
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
      if (!updatedSlot) throw new ConflictException('Slot is fully booked');
      await session.commitTransaction();

      return appointment;
    } catch (error) {
      console.log(error);
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
      //if appointmetId is exist
      const existingAppointment = await this.appointmentModel
        .findOne({
          _id: appointmentId,
          status: { $ne: AppointmentStatus.CANCELLED },
        })
        .session(session);

      if (!existingAppointment) {
        throw new NotFoundException('The appointment is not found!');
      }

      if (user.role === 'PATIENT') {
        if (existingAppointment.patientId.toString() !== user._id.toString())
          throw new ForbiddenException(
            'Sorry you are not allowed to do this process!',
          );
      }

      //update the appointment status to canceled
      existingAppointment.status = AppointmentStatus.CANCELLED;
      await existingAppointment.save({ session });

      await this.slotsService.decrementWaitingList(
        existingAppointment.slotId.toString(),
        session,
      );

      await session.commitTransaction();

      return { message: 'The appointment is canceled successfully' };
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
  // في الـ Service Method Signature
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
    if (!appointment)
      throw new NotFoundException('this appointment is not found!');
    if (user.role === 'PATIENT') {
      if (appointment.patientId._id.toString() !== user._id.toString())
        throw new ForbiddenException('sorry this appointment is not yours!');
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

    return appointments;
  }
  async updateAppointment(
    updateAppointmentDto: UpdateAppointmentDto,
    appointmentId: string,
  ): Promise<Appointment> {
    if (updateAppointmentDto.status == AppointmentStatus.CANCELLED)
      throw new ConflictException(
        'this route is not for canceling the appointment please go to the right one',
      );
    if (updateAppointmentDto.doctorId) {
      const doctor = await this.doctorsService.getDoctorById(
        updateAppointmentDto.doctorId,
      );
      if (!doctor) throw new NotFoundException('this doctor is not found!');
    }
    if (updateAppointmentDto.slotId) {
      const slot = await this.slotsService.getSlot(updateAppointmentDto.slotId);
      if (!slot) throw new NotFoundException('this slot is not found!');
    }
    const appointment = await this.appointmentModel.findByIdAndUpdate(
      appointmentId,
      updateAppointmentDto,
      { new: true },
    );
    if (!appointment) {
      throw new NotFoundException(
        `Appointment with ID ${appointmentId} not found`,
      );
    }
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
      throw new NotFoundException('Appointment not found!');
    }
    return updatedAppointment;
  }
}
