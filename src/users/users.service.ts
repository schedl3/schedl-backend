import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findOne(idAddress: string): Promise<User | undefined> {
    return this.userModel.findOne({ idAddress });
  }

  async create(user: Partial<UserDocument>): Promise<User> {
    const newUser = new this.userModel(user);
    return newUser.save();
  }

  async createSampleUsers(): Promise<void> {
    const users = [
      { idAddress: 'id1', ethereumAddress: 'eth1', emailAddress: 'user1@example.com', description: 'User 1', password: 'password1' },
      { idAddress: 'id2', ethereumAddress: 'eth2', emailAddress: 'user2@example.com', description: 'User 2', password: 'password2' },
      // Add more users as needed
    ];

    for (const user of users) {
      await this.create(user);
    }
  }

  // Add other methods as needed
}