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
import { User } from './user-schema';
import { Model } from 'mongoose';

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
}
