import { SignUpCredentials } from './../auth/dtos/signUpCredentials';
import { InjectModel } from '@nestjs/mongoose';
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
  async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).select('+password');
    return user;
  }
}
