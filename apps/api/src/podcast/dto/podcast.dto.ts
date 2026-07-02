import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GeneratePodcastDto {
  @ApiProperty({
    example: 'Buat podcast berdurasi 3 menit tentang Bun vs Node.js.',
    description: 'The prompt to guide the AI podcast script generation',
  })
  @IsString({ message: 'Prompt must be a string' })
  @IsNotEmpty({ message: 'Prompt is required' })
  prompt: string;
}

export class PodcastQueryDto {
  @ApiProperty({ required: false, example: 'Bun', description: 'Search term to filter podcasts by prompt or title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, example: 1, default: 1, description: 'Page number for pagination' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, example: 10, default: 10, description: 'Number of items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ required: false, enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'], description: 'Filter podcasts by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, example: 'true', description: 'Filter only podcasts created by the current logged-in user' })
  @IsOptional()
  @IsString()
  myPodcasts?: string;
}
