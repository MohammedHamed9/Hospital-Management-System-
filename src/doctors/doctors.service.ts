import { CloudinaryService } from './../cloudinary/cloudinary.service';
import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Doctor } from './doctor-schema';
import { Model } from 'mongoose';
import { UsersService } from 'src/users/users.service';
import { CreateDoctorDto } from './dtos/createDoctorDto';
import { UpdateDoctorDto } from './dtos/updateDoctorDto';
import { ClientSession } from 'mongoose';

@Injectable()
export class DoctorsService {
  private readonly logger = new Logger(DoctorsService.name);

  constructor(
    @InjectModel('Doctor') private readonly doctorModel: Model<Doctor>,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  async createAccount(
    id: string,
    createDoctorDto: CreateDoctorDto,
    image: Express.Multer.File,
  ): Promise<Doctor> {
    const oldDoctor = await this.userService.findById(id);
    if (!oldDoctor) {
      this.logger.warn(`Doctor creation failed — user not found: userId=${id}`);
      throw new Error('Doctor not found');
    }
    const { specialization, experience, consultationFee, bio } =
      createDoctorDto;
    const olderDoctorData = await this.doctorModel.findOne({ userId: id });
    if (olderDoctorData) {
      this.logger.warn(
        `Doctor creation failed — doctor already exists: userId=${id}`,
      );
      throw new ConflictException('Doctor data not found');
    }
    const imageUrl = image
      ? await this.cloudinaryService.uploadImage(image)
      : '';
    const doctor = await this.doctorModel.create({
      specialization,
      experience,
      consultationFee,
      bio,
      userId: id,
      image: imageUrl,
    });
    const populatedDoctor = await doctor.populate('userId', 'name email role');
    this.logger.log(
      `Doctor profile created for userId=${id}, doctorId=${doctor._id}`,
    );
    return populatedDoctor;
  }
  async updateData(
    id: string,
    updateDoctorDto: UpdateDoctorDto,
    image: Express.Multer.File,
    user,
  ): Promise<Doctor> {
    if (user.id !== id) {
      this.logger.warn(
        `Unauthorized update attempt — userId=${user.id} tried to update doctorId=${id}`,
      );
      throw new UnauthorizedException('sorry this is not your id!');
    }

    const oldDoctor = await this.userService.findById(id);
    if (!oldDoctor) {
      this.logger.warn(`Doctor update failed — user not found: userId=${id}`);
      throw new NotFoundException('Doctor not found');
    }
    const { specialization, experience, consultationFee, bio } =
      updateDoctorDto;
    const olderDoctorData = await this.doctorModel.findOne({ userId: id });
    if (!olderDoctorData) {
      this.logger.warn(
        `Doctor update failed — doctor data not found: userId=${id}`,
      );
      throw new ConflictException('Doctor data not found');
    }
    let imageUrl = olderDoctorData.image;
    if (image) {
      imageUrl = await this.cloudinaryService.uploadImage(image);
    }
    const doctor = await this.doctorModel.findByIdAndUpdate(
      olderDoctorData._id,
      {
        specialization,
        experience,
        consultationFee,
        bio,
        image: imageUrl,
      },
      { new: true, runValidators: true },
    );
    if (!doctor) {
      this.logger.error(
        `Doctor update failed — could not update data for userId=${id}`,
      );
      throw new Error('Failed to update doctor data');
    }
    const populatedDoctor = await doctor.populate('userId', 'name email role');
    this.logger.log(
      `Doctor profile updated for userId=${id}, doctorId=${doctor._id}`,
    );
    return populatedDoctor;
  }
  async getMyAccount(user): Promise<Doctor> {
    const data = await this.doctorModel.findOne({ userId: user.id });

    const doctor = await data?.populate(
      'userId',
      'name email role address phoneNumber',
    );
    if (!doctor) {
      this.logger.warn(
        `Doctor retrieval failed — doctor not found for userId=${user.id}`,
      );
      throw new NotFoundException('Doctor not found');
    }
    this.logger.log(`Retrieved doctor profile for userId=${user.id}`);
    return doctor;
  }
  async getDoctorById(id: string): Promise<Doctor> {
    const doctor = await this.doctorModel.findOne({ userId: id });
    if (!doctor) {
      this.logger.warn(
        `Doctor retrieval failed — doctor not found for userId=${id}`,
      );
      throw new NotFoundException('Doctor not found');
    }
    const populatedDoctor = await doctor.populate(
      'userId',
      'name email role address phoneNumber',
    );
    this.logger.log(`Retrieved doctor profile for userId=${id}`);
    return populatedDoctor;
  }
  async findBySpecialization(specialization: string): Promise<Doctor[]> {
    const trimmedSpecialization = specialization.trim();
    const regex = new RegExp(trimmedSpecialization, 'i');

    const doctors = await this.doctorModel
      .find({ specialization: regex })
      .populate('userId', 'name email phoneNumber')
      .exec();

    if (!doctors || doctors.length === 0) {
      this.logger.warn(
        `Doctor search failed — no doctors found with specialization: ${specialization}`,
      );
      throw new NotFoundException(
        `No doctors found with specialization: ${specialization}`,
      );
    }
    this.logger.log(
      `Found ${doctors.length} doctors with specialization: ${specialization}`,
    );
    return doctors;
  }
  async deleteMyAccount(
    doctorObjectId: any,
    session?: ClientSession,
  ): Promise<void> {
    this.logger.log(`Deleting doctor account for userId=${doctorObjectId}`);
    await this.doctorModel.findOneAndDelete(
      { userId: doctorObjectId },
      { session },
    );
  }
}
