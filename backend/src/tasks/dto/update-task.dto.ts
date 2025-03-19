import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskDto {
  @ApiProperty({
    description: 'The title of the task',
    example: 'Updated project documentation',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'The description of the task',
    example: 'Updated description with more details',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'The status of the task',
    example: 'COMPLETED',
    enum: ['PENDING', 'COMPLETED'],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'COMPLETED'])
  status?: string;

  @ApiProperty({
    description: 'The due date of the task in ISO format',
    example: '2023-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}