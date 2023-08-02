import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) { }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneUsername(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // const payload = { username: user.username, sub: user.userId };
    const payload = { sub: user._doc.idAddress, idAddress: user._doc.idAddress, username: user._doc.username, assistantXmtpAddress: user._doc.assistantXmtpAddress, ethereumAddress: user._doc.ethereumAddress };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async ethlogin(user: any) {
    // const { password = null, ...userWithoutPassword } = user;
    // return userWithoutPassword;
    return { idAddress: user._doc.idAddress, ethereumAddress: user._doc.ethereumAddress, dateCreated: user._doc.dateCreated };
  }


  async ethloginjwt(user: any) {
    // return this.login(user);
    const payload = { sub: user._doc._id, idAddress: user._doc.idAddress, username: user._doc.username, assistantXmtpAddress: user._doc.assistantXmtpAddress, ethereumAddress: user._doc.ethereumAddress };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}