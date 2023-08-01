import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as Joi from 'joi';
import { User, UserDocument, Schedule } from './schemas/user.schema';
import { XmtpService } from '../xmtp/xmtp.service';

// e.g. "8-11:30,13-16"
function validateTimeLogic(value: string): boolean {
  let prevEndTime = 0.0;

  const timeSlots = value.split(",");
  for (let timeSlot of timeSlots) {
    let times = timeSlot.split("-");
    let startTime = parseFloat(times[0].replace(":", "."));
    let endTime = parseFloat(times[1].replace(":", "."));

    // Validation 1: start time must be before end time
    if (startTime >= endTime) {
      return false;
    }

    // Validation 2: no overlaps and times are in order
    if (prevEndTime > startTime) {
      return false;
    }
    prevEndTime = endTime;
  }

  return true; // return true if all conditions are met
}

const timeSlotSchema = Joi.string()
  .empty('') // Allow empty strings
  .pattern(/\b([01]?[0-9]|2[0-3])(:[0-5][0-9])?-[01]?[0-9]|2[0-3](:[0-5][0-9])?(,([01]?[0-9]|2[0-3])(:[0-5][0-9])?-([01]?[0-9]|2[0-3])(:[0-5][0-9])?)*\b/)
  .custom((value, helpers) => {
    if (!validateTimeLogic(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'Time slots validation');

// Schema for validating schedule
const schema = Joi.object({
  Sun: timeSlotSchema,
  Mon: timeSlotSchema,
  Tue: timeSlotSchema,
  Wed: timeSlotSchema,
  Thu: timeSlotSchema,
  Fri: timeSlotSchema,
  Sat: timeSlotSchema
}).required()

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private xmtpService: XmtpService,
  ) {}

  async findOne(idAddress: string): Promise<User | undefined> {
    return this.userModel.findOne({ idAddress });
  }

  async findOneUsername(username: string): Promise<User | undefined> {
    return this.userModel.findOne({ username });
  }

  async setUsername(idAddress: string, username: string): Promise<User> {
    const user = await this.findOne(idAddress);
    if (!user) {
      throw new Error('User not found');
    }
    if (!(user.username === undefined || user.username === '')) {
      // prevent squatting
      throw new Error('Username can only be set if it is currently empty.');
    };

    user.username = username;
    await this.userModel.updateOne({ idAddress }, { username });
    return user;
  }

  async setAssistantXmtpAddress(idAddress: string, assistantXmtpAddress: string): Promise<User> {
    const user = await this.findOne(idAddress);
    if (!user) {
      throw new Error('User not found');
    }
    const updateAssIfConfirmed = async (newStatus: string) => {
      if (newStatus !== 'confirmed') {
        throw new Error(`Invalid status: ${newStatus}`);
      }
      try {
        await this.userModel.updateOne({ idAddress }, { assistantXmtpAddress });
        console.log(`Assistant XMTP address updated to ${assistantXmtpAddress}.`);
      } catch (error) {
        console.error(`Error updating address: ${error}`);
      }
    }
    this.xmtpService.sendMessageAwaitConfirmation('SET-ASSISTANT', assistantXmtpAddress, updateAssIfConfirmed);

    user.assistantXmtpAddress = assistantXmtpAddress;
    // await this.userModel.updateOne({ idAddress }, { assistantXmtpAddress });
    return user;
  }

  async setIdAddressIsPublic(idAddress: string, idAddressIsPublic: boolean): Promise<User> {
    const user = await this.findOne(idAddress);
    if (!user) {
      throw new Error('User not found');
    }
    user.idAddressIsPublic = idAddressIsPublic;
    await this.userModel.updateOne({ idAddress }, { idAddressIsPublic });
    return user;
  }

  async getProfileByUsername(username: string): Promise<Partial<User> | undefined> {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new Error('User not found');
    }
    return {
      username: user.username,
      idAddress: user.idAddressIsPublic ? user.idAddress : undefined,
      description: user.description,
      schedule: user.schedule,
    };
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
    const { error, value } = schema.validate(schedule);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      throw new Error('Invalid schedule');
    }

    user.schedule = schedule;
    await this.userModel.updateOne({ idAddress }, { schedule });
    return user;
  }

  async createSampleUsers(): Promise<void> {
    const users = [
      {
        idAddress: '0x78a74b5D1A86704c573163C3aafB6e7234c9Da1e',
        ethereumAddress: '0x78a74b5D1A86704c573163C3aafB6e7234c9Da1e',
        emailAddress: 'user1@example.com',
        description: 'SuperUser 1',
        password: 'password1',
        username: 'superuser',
        tz: 'America/New_York',
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
        tz: 'UTC',
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