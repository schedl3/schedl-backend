export class CreateBookingDto {
  readonly status: string;
  readonly fromAddress: string;
  readonly toUsername: string;
  readonly start: Date;
  readonly minutes: number;
  readonly msg: string;
}
