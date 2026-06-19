import { IsEnum, IsOptional, IsDateString } from 'class-validator';

export class GetTimelineDto {
  @IsEnum(['weekly', 'monthly', 'yearly'])
  period: 'weekly' | 'monthly' | 'yearly';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
