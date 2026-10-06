import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Connection, Model, Types } from 'mongoose';
import { AppointmentsService } from 'src/appointments/appointments.service';
import { DoctorsService } from 'src/doctors/doctors.service';
import { PrescriptionService } from 'src/prescriptions/prescriptions.service';
import { ServicesBookingService } from 'src/services-booking/services-booking.service';
import { ServicesService } from 'src/services/services.service';
import { SlotsService } from 'src/slots/slots.service';
import { SignUpCredentials } from './../auth/dtos/signUpCredentials';
import { CreateUserDto } from './dtos/createUserDto';
import { GetUsersDto } from './dtos/getUsersDro';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { User, UserDocument, UserRole } from './user-schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly doctorsService: DoctorsService,
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointmentsService: AppointmentsService,
    private readonly slotsService: SlotsService,
    @Inject(forwardRef(() => ServicesBookingService))
    private readonly servicesBookingService: ServicesBookingService,
    @Inject(forwardRef( () => PrescriptionService))
    private readonly prescriptionService: PrescriptionService,
    @Inject(forwardRef(() => ServicesService))
    private readonly servicesService: ServicesService,
  ) {}

  async create(signUpCredentials: SignUpCredentials): Promise<UserDocument> {
    try {
      return await this.userModel.create(signUpCredentials);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('the email address is already exists!');
      }
      throw new InternalServerErrorException();
    }
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    try {
      createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
      return await this.userModel.create(createUserDto);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('the email address is already exists!');
      }
      throw new InternalServerErrorException();
    }
  }

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password +passwordResetToken +passwordResetExpires');
    return user;
  }

  async findByResetToken(hashedToken: string): Promise<UserDocument | null> {
    const user = await this.userModel
      .findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
      })
      .select('+password +passwordResetToken +passwordResetExpires');
    return user;
  }

  async findSomeUsers(getUsersDto: GetUsersDto): Promise<UserDocument[]> {
    const Admins = await this.userModel.find({
      role: { $in: getUsersDto.roles },
      isActive: true,
    });
    return Admins;
  }

  async findAllUsers(): Promise<UserDocument[]> {
    return await this.userModel
      .find({ isActive: true })
      .select('-password -passwordChangedAt');
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(id)
      .select('-password -passwordChangedAt');
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByIdWithPassword(id: string): Promise<UserDocument | null> {
    return await this.userModel.findById(id).select('+password');
  }

  async getProfile(userId: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(userId)
      .select(
        '-password -passwordResetToken -passwordResetExpires -passwordChangedAt',
      );
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    return user;
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, updateProfileDto, { new: true })
      .select(
        '-password -passwordResetToken -passwordResetExpires -passwordChangedAt',
      );
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    return user;
  }

  /**
   * Activates a user account (sets isActive = true and deactivatedAt = null).
   * Note: Passes { includeInactive: true } in query to bypass pre-find active isolation middleware.
   */
  async activateUser(userId: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userModel.findOne({
      _id: userId,
      includeInactive: true,
    } as any);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.isActive) {
      throw new BadRequestException('User is already active');
    }

    user.isActive = true;
    user.deactivatedAt = undefined;

    return user.save();
  }

  /**
   * Aggregates dashboard metrics:
   * - totalPatients (UserRole.PATIENT)
   * - totalDoctors (UserRole.DOCTOR)
   * - todayAppointments (created today)
   * - pendingAppointments (status PENDING)
   * - completedAppointments (status COMPLETED)
   * - activeServices (Services with isActive = true)
   */
  async getDashboardStats(): Promise<{
    totalPatients: number;
    totalDoctors: number;
    todayAppointments: number;
    pendingAppointments: number;
    completedAppointments: number;
    activeServices: number;
  }> {
    const [
      totalPatients,
      totalDoctors,
      appointmentStats,
      activeServices,
    ] = await Promise.all([
      this.userModel.countDocuments({ role: UserRole.PATIENT, isActive: true }),
      this.userModel.countDocuments({ role: UserRole.DOCTOR, isActive: true }),
      this.appointmentsService.getAppointmentStats(),
      this.servicesService.countActiveServices(),
    ]);

    return {
      totalPatients,
      totalDoctors,
      todayAppointments: appointmentStats.todayAppointments,
      pendingAppointments: appointmentStats.pendingAppointments,
      completedAppointments: appointmentStats.completedAppointments,
      activeServices,
    };
  }

  /**
   * Aggregates complete medical history for a user combining:
   * 1. Completed Appointments
   * 2. Prescriptions
   * 3. Service Bookings
   */
  async getMyMedicalHistory(userId: string): Promise<{
    patient: {
      id: string;
      name: string;
      email: string;
      phone: string;
      dateOfBirth: Date;
      gender: string;
    };
    summary: {
      totalCompletedAppointments: number;
      totalPrescriptions: number;
      totalServicesBookings: number;
    };
    completedAppointments: any[];
    prescriptions: any[];
    servicesBookings: any[];
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const patient = await this.userModel
      .findById(userId)
      .select('name email phone dateOfBirth gender role isActive');

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    const [completedAppointments, prescriptions, servicesBookings] =
      await Promise.all([
        this.appointmentsService.getCompletedAppointmentsByPatientId(userId),
        this.prescriptionService.getPatientPrescriptionsForMedicalRecord(userId),
        this.servicesBookingService.findUserBookings(userId),
      ]);

    return {
      patient: {
        id: patient._id.toString(),
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
      },
      summary: {
        totalCompletedAppointments: completedAppointments.length,
        totalPrescriptions: prescriptions.length,
        totalServicesBookings: servicesBookings.length,
      },
      completedAppointments,
      prescriptions,
      servicesBookings,
    };
  }

  async deactivateAccount(
    userId: string,
  ): Promise<{ message: string; deactivatedAt: Date }> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const deactivatedAt = new Date();
      const user = await this.userModel.findByIdAndUpdate(
        userId,
        {
          isActive: false,
          deactivatedAt,
          passwordChangedAt: deactivatedAt,
        },
        { new: true, runValidators: true, session: session },
      );

      if (!user) {
        throw new NotFoundException('User account not found');
      }
      if (user.role === UserRole.DOCTOR) {
        const doctorObjectId = new Types.ObjectId(userId);
        await this.doctorsService.deleteMyAccount(doctorObjectId, session);
        await this.appointmentsService.cancelAppointmentsByUserId(
          doctorObjectId,
          user.role,
          session,
        );
        await this.slotsService.cancelSlotsByDoctorId(doctorObjectId, session);
      }
      if (user.role === UserRole.PATIENT) {
        await this.appointmentsService.cancelAppointmentsByUserId(
          userId,
          user.role,
          session,
        );
        await this.servicesBookingService.cancelBookingsByUserId(
          userId,
          session,
        );
      }
      await session.commitTransaction();
      return {
        message: 'Account successfully deactivated',
        deactivatedAt,
      };
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateUser(id: string, updateUserDto: any): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, {
      new: true,
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async deleteById(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      id,
      { isActive: false, deactivatedAt: new Date() },
      { new: true },
    );
  }
}
