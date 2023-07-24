import { PassportStrategy } from '@nestjs/passport';
import { Injectable /*, UnauthorizedException*/ } from '@nestjs/common';
import { Strategy as EthStrategy /*, SessionNonceStore*/ } from 'passport-ethereum-siwe';
import { AuthService } from './auth.service';

@Injectable()
export class EthereumStrategy extends PassportStrategy(EthStrategy, 'ethereum', true) { // YAY
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string): Promise<any> {
    const user = 'test';
    // const user = await this.authService.validateUser(username, password);
    // if (!user) {
    // throw new UnauthorizedException();
    // }
    return user;
  }
}