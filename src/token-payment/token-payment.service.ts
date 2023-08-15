import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class TokenPaymentService {
  private tokenContractAddress: string;

  constructor(
    ) {
    if (process.env.NODE_ENV === 'production') {
      this.tokenContractAddress = process.env.PRODUCTION_TOKEN_CONTRACT_ADDRESS;
    } else {
      this.tokenContractAddress = process.env.DEVELOPMENT_TOKEN_CONTRACT_ADDRESS;
    }

    if (!ethers.utils.isAddress(this.tokenContractAddress)) {
      throw new Error('Invalid token contract address');
    }
  }

  async getDepositedTokens(ethereumAddress: string): Promise<number> {
    let provider;

    if (process.env.NODE_ENV === 'production') {
      provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_API_SECRET}`);
    } else {
      provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
    }

    const abi = [
      {
        "constant": true,
        "inputs": [
          {
            "name": "_owner",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "name": "balance",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_owner",
            "type": "address"
          }
        ],
        "name": "depositedTokensOf",
        "outputs": [
          {
            "name": "balance",
            "type": "uint256"
          }
        ],
        "type": "function"
      }
    ];
    const tokenContract = new ethers.Contract(this.tokenContractAddress, abi, provider);
    // const balance = await tokenContract.balanceOf(ethereumAddress);
    const balance = await tokenContract.depositedTokensOf(ethereumAddress);
    const normalizedBalance = ethers.utils.formatUnits(balance, 18);

    return parseFloat(normalizedBalance);
  }
}