import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) { }

  // this is specific to local strategy
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneUsername(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: UserDocument) {
    return this.ethloginjwt(user);
  }

  async ethloginjwt(user: UserDocument) {
    const payload = { sub: user._id, idAddress: user.idAddress, username: user.username, assistantXmtpAddress: user.assistantXmtpAddress };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}