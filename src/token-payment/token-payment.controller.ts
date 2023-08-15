import { Controller, Get, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { TokenPaymentService } from './token-payment.service';
import { UsersService } from '../users/users.service';

@Controller('token-payment')
export class TokenPaymentController {
  constructor(
    private readonly tokenPaymentService: TokenPaymentService,
    private usersService: UsersService,
  ) { }

  @Get('deposited-tokens')
  async getDepositedTokens(
    @Query('address') address?: string,
    @Query('username') username?: string
  ): Promise<{ depositedTokens: number }> {
    let ethereumAddress: string;

    if (address) {
      ethereumAddress = address;
    } else if (username) {
      const user = await this.usersService.findOneUsername(username);
      if (!user) {
        throw new NotFoundException(`User with username ${username} not found`);
      }
      ethereumAddress = user.idAddress;
    } else {
      throw new BadRequestException('You must provide either an address or a username');
    }

    const depositedTokens = await this.tokenPaymentService.getDepositedTokens(ethereumAddress);
    return { depositedTokens };
  }
}
