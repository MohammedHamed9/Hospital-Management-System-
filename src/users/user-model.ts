import { SignUpCredentials } from '../auth/dtos/signUpCredentials';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user-schema';
import { Model } from 'mongoose';

@Injectable()
export class UserModel {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}
}
