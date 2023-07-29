import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, Schedule } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findOne(idAddress: string): Promise<User | undefined> {
    return this.userModel.findOne({ idAddress });
  }

  async setUsername(idAddress: string, username: string): Promise<User> {
    const user = await this.findOne(idAddress);
    if (!user) {
      throw new Error('User not found');
    }
    user.username = username;
    await this.userModel.updateOne({ idAddress }, { username });
    return user;
  }

  async setAssistantXmtpAddress(idAddress: string, assistantXmtpAddress: string): Promise<User> {
    const user = await this.findOne(idAddress);
    if (!user) {
      throw new Error('User not found');
    }
    user.assistantXmtpAddress = assistantXmtpAddress;
    await this.userModel.updateOne({ idAddress }, { assistantXmtpAddress });
    return user;
  }

  async create(user: Partial<UserDocument>): Promise<User> {
    const newUser = new this.userModel(user);
    return newUser.save();
  }

  async updateSchedule(idAddress: string, schedule: Schedule): Promise<User> {
    const user = await this.findOne(idAddress);
    if (!user) {
      throw new Error('User not found');
    }
    user.schedule = schedule;
    await this.userModel.updateOne({ idAddress }, { schedule });
    return user;
  }

  async createSampleUsers(): Promise<void> {
    const users = [
      { 
        idAddress: 'id1', 
        ethereumAddress: 'eth1', 
        emailAddress: 'user1@example.com', 
        description: 'User 1', 
        password: 'password1',
        username: 'user1',
        timeZone: 'America/New_York',
        schedule: {
          Sun: '',
          Mon: '9-17:30',
          Tue: '9-17:30',
          Wed: '9-17:30',
          Thu: '9-17:30',
          Fri: '9-17:30',
          Sat: '9-11:30',
        },
      },
      { 
        idAddress: 'id2', 
        ethereumAddress: 'eth2', 
        emailAddress: 'user2@example.com', 
        description: 'User 2', 
        password: 'password2',
        username: 'user2',
        timeZone: 'UTC',
        schedule: {
          Sun: '9-17:30',
          Mon: '',
          Tue: '9-17:30',
          Wed: '9-17:30',
          Thu: '9-17:30',
          Fri: '9-17:30',
          Sat: '9-17:30',
        },
      },
      // Add more users as needed
    ];

    for (const user of users) {
      await this.create(user);
    }
  }

  // Add other methods as needed
}