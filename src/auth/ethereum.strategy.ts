import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy as EthStrategy } from 'passport-ethereum-siwe';
import { UsersService } from '../users/users.service';
import { User } from 'src/users/schemas/user.schema';

@Injectable()
export class EthereumStrategy extends PassportStrategy(EthStrategy, 'ethereum', true) {
  constructor(private usersService: UsersService) {
    super({ tomo: 'test'});
  }

  async validate(username: string): Promise<User> {
    let user = await this.usersService.findOne(username);
    if (!user) {
      user = await this.usersService.create({
        idAddress: username,
        dateCreated: new Date(),
        // Add other fields as needed
      });
    }
    return user;
  }
}