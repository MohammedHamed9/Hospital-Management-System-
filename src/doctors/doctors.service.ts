import { CloudinaryService } from './../cloudinary/cloudinary.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Doctor } from './doctor-schema';
import { Model } from 'mongoose';
import { UsersService } from 'src/users/users.service';
import { CreateDoctorDto } from './dtos/createDoctorDto';
import { UpdateDoctorDto } from './dtos/updateDoctorDto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel('Doctor') private readonly doctorModel: Model<Doctor>,
    private readonly userService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  async updateAccount(
    id: string,
    createDoctorDto: CreateDoctorDto,
    image: Express.Multer.File,
  ): Promise<Doctor> {
    const oldDoctor = await this.userService.findById(id);
    if (!oldDoctor) {
      throw new Error('Doctor not found');
    }
    const { specialization, experience, consultationFee, bio } =
      createDoctorDto;
    const olderDoctorData = await this.doctorModel.findOne({ userId: id });
    if (olderDoctorData) {
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
    return populatedDoctor;
  }
  async updateData(
    id: string,
    updateDoctorDto: UpdateDoctorDto,
    image: Express.Multer.File,
    user,
  ): Promise<Doctor> {
    if (user.id !== id)
      throw new UnauthorizedException('sorry this is not your id!');

    const oldDoctor = await this.userService.findById(id);
    if (!oldDoctor) {
      throw new NotFoundException('Doctor not found');
    }
    const { specialization, experience, consultationFee, bio } =
      updateDoctorDto;
    const olderDoctorData = await this.doctorModel.findOne({ userId: id });
    if (!olderDoctorData) {
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
      throw new Error('Failed to update doctor data');
    }
    const populatedDoctor = await doctor.populate('userId', 'name email role');
    return populatedDoctor;
  }
  async getMyAccount(user): Promise<Doctor> {
    const data = await this.doctorModel.findOne({ userId: user.id });

    const doctor = await data?.populate(
      'userId',
      'name email role address phoneNumber',
    );
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    return doctor;
  }
  async getDoctorById(id: string): Promise<Doctor> {
    const doctor = await this.doctorModel.findOne({ userId: id });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    const populatedDoctor = await doctor.populate(
      'userId',
      'name email role address phoneNumber',
    );
    return populatedDoctor;
  }
  async deleteMyAccount(user): Promise<void> {
    await this.userService.deleteById(user.id);
    await this.doctorModel.findByIdAndDelete({ userId: user.id });
  }
}
