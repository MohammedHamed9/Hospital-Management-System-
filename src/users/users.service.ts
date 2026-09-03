import { CreateUserDto } from './dtos/createUserDto';
import { SignUpCredentials } from './../auth/dtos/signUpCredentials';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';

import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User, UserRole } from './user-schema';
import { Model } from 'mongoose';
import { GetUsersDto } from './dtos/getUsersDro';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}
  async create(signUpCredentials: SignUpCredentials): Promise<User> {
    try {
      return await this.userModel.create(signUpCredentials);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('the email address ia already exists!');
      }
      throw new InternalServerErrorException();
    }
  }
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
      return await this.userModel.create(createUserDto);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('the email address ia already exists!');
      }
      throw new InternalServerErrorException();
    }
  }
  async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).select('+password');
    return user;
  }
  async findSomeUsers(getUsersDto: GetUsersDto): Promise<User[]> {
    const Admins = await this.userModel.find({
      role: { $in: getUsersDto.roles },
      isActive: true,
    });
    return Admins;
  }
  async findAllUsers(): Promise<User[]> {
    return await this.userModel
      .find({ isActive: true })
      .select('-password -passwordChangedAt');
  }
  async findById(id: string): Promise<User> {
    const user = await this.userModel
      .findById(id)
      .select('-password -passwordChangedAt');
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
  async deleteById(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
  }
}
