/**
 * Example: How to properly use nested objects with the Global Validation Pipe
 * 
 * This file demonstrates the correct way to define DTOs with nested objects
 * that will be automatically validated and transformed by the GlobalValidationPipe.
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// Example 1: Simple Nested Object
// ============================================

export class AddressDto {
  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: '10001' })
  @IsString()
  @IsNotEmpty()
  zipCode: string;
}

export class CreateUserWithAddressDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: AddressDto, required: false })
  @ValidateNested() // ✅ Required for nested object validation
  @Type(() => AddressDto) // ✅ Required for nested object transformation
  @IsOptional()
  address?: AddressDto;
}

// ============================================
// Example 2: Array of Nested Objects
// ============================================

export class TagDto {
  @ApiProperty({ example: 'bug' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '#FF0000' })
  @IsString()
  @IsNotEmpty()
  color: string;
}

export class CreateTaskWithTagsDto {
  @ApiProperty({ example: 'Fix critical bug' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ type: [TagDto], required: false })
  @IsArray()
  @ValidateNested({ each: true }) // ✅ Required: validates each array element
  @Type(() => TagDto) // ✅ Required: transforms each array element
  @IsOptional()
  tags?: TagDto[];
}

// ============================================
// Example 3: Deeply Nested Objects
// ============================================

export class ContactInfoDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class CompanyInfoDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({ type: ContactInfoDto })
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact: ContactInfoDto;
}

export class CreateOrganizationWithNestedDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: CompanyInfoDto })
  @ValidateNested()
  @Type(() => CompanyInfoDto)
  companyInfo: CompanyInfoDto;
}

// ============================================
// Example 4: Automatic Type Conversion
// ============================================

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class CreateTaskWithAutoConversionDto {
  @ApiProperty({ example: 'Implement feature' })
  @IsString()
  @IsNotEmpty()
  title: string;

  // These will be automatically converted from strings to their types
  @ApiProperty({ example: 8 })
  @IsInt()
  storyPoints: number; // ✅ "8" (string) → 8 (number)

  @ApiProperty({ example: true })
  @IsBoolean()
  isCompleted: boolean; // ✅ "true" (string) → true (boolean)

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH })
  @IsEnum(TaskPriority)
  priority: TaskPriority; // ✅ "HIGH" (string) → TaskPriority.HIGH
}

// ============================================
// Example 5: Mixed Nested Objects and Arrays
// ============================================

export class AssigneeDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'DEVELOPER' })
  @IsString()
  @IsNotEmpty()
  role: string;
}

export class MetadataDto {
  @ApiProperty({ example: { source: 'api', version: '1.0' } })
  @IsOptional()
  custom?: Record<string, any>;
}

export class CreateTaskComplexDto {
  @ApiProperty({ example: 'Complex task' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ type: [AssigneeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssigneeDto)
  assignees: AssigneeDto[];

  @ApiProperty({ type: MetadataDto, required: false })
  @ValidateNested()
  @Type(() => MetadataDto)
  @IsOptional()
  metadata?: MetadataDto;
}

/**
 * Usage Example:
 * 
 * POST /api/tasks
 * {
 *   "title": "Complex task",
 *   "assignees": [
 *     { "userId": "123", "role": "DEVELOPER" },
 *     { "userId": "456", "role": "REVIEWER" }
 *   ],
 *   "metadata": {
 *     "custom": { "source": "api", "version": "1.0" }
 *   }
 * }
 * 
 * The GlobalValidationPipe will:
 * 1. Transform the plain JSON objects into DTO instances
 * 2. Validate all nested objects and arrays
 * 3. Convert types automatically (string → number, etc.)
 * 4. Strip unknown properties (whitelist)
 * 5. Return detailed error messages if validation fails
 */

