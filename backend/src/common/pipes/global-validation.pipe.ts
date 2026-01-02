import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  ValidationError,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ValidationPipeOptions } from '@nestjs/common/pipes/validation.pipe';

/**
 * Enhanced Global Validation Pipe with improved nested object transformation
 * 
 * Features:
 * - Whitelist validation (strips unknown properties)
 * - Forbids non-whitelisted properties
 * - Automatic transformation of nested objects
 * - Better error messages
 * - Support for arrays and nested DTOs
 */
@Injectable()
export class GlobalValidationPipe implements PipeTransform<any> {
  private readonly options: ValidationPipeOptions;

  constructor(options?: Partial<ValidationPipeOptions>) {
    this.options = {
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Automatically convert types (string to number, etc.)
        exposeDefaultValues: true, // Expose default values from class properties
        excludeExtraneousValues: false, // Don't exclude extraneous values (whitelist handles this)
      },
      skipMissingProperties: false, // Don't skip validation for missing properties
      skipNullProperties: false, // Don't skip validation for null properties
      skipUndefinedProperties: false, // Don't skip validation for undefined properties
      validationError: {
        target: false, // Don't expose target object in error
        value: true, // Expose the value that failed validation
      },
      stopAtFirstError: false, // Continue validation after first error to show all errors
      ...options,
    };
  }

  async transform(value: any, { metatype }: ArgumentMetadata) {
    // Skip validation if no metatype or if it's a native JavaScript type
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Transform plain object to class instance with nested object support
    const object = plainToInstance(metatype, value, {
      enableImplicitConversion: this.options.transformOptions?.enableImplicitConversion ?? true,
      exposeDefaultValues: this.options.transformOptions?.exposeDefaultValues ?? true,
      excludeExtraneousValues: this.options.transformOptions?.excludeExtraneousValues ?? false,
      // Enable deep transformation for nested objects
      enableCircularCheck: true,
      // Transform arrays and nested objects
      strategy: 'excludeAll', // Only include properties with @Expose() or no decorator
    });

    // Validate the transformed object
    const errors = await validate(object, {
      whitelist: this.options.whitelist,
      forbidNonWhitelisted: this.options.forbidNonWhitelisted,
      skipMissingProperties: this.options.skipMissingProperties,
      skipNullProperties: this.options.skipNullProperties,
      skipUndefinedProperties: this.options.skipUndefinedProperties,
      stopAtFirstError: this.options.stopAtFirstError,
      validationError: this.options.validationError,
    });

    if (errors.length > 0) {
      throw new BadRequestException(this.formatErrors(errors));
    }

    return object;
  }

  /**
   * Check if the metatype should be validated
   */
  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * Format validation errors into a readable structure
   */
  private formatErrors(errors: ValidationError[]): any {
    const formattedErrors: any = {};

    errors.forEach((error) => {
      if (error.children && error.children.length > 0) {
        // Handle nested validation errors
        formattedErrors[error.property] = this.formatErrors(error.children);
      } else {
        // Handle top-level validation errors
        formattedErrors[error.property] = Object.values(error.constraints || {});
      }
    });

    return {
      statusCode: 400,
      message: 'Validation failed',
      errors: formattedErrors,
    };
  }
}

