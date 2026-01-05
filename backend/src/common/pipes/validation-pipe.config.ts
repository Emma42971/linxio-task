import { ValidationPipeOptions } from '@nestjs/common/pipes/validation.pipe';

/**
 * Configuration for the global ValidationPipe
 * 
 * This configuration provides:
 * - Whitelist validation (strips unknown properties)
 * - Forbids non-whitelisted properties
 * - Automatic transformation of nested objects
 * - Type conversion (string to number, etc.)
 * - Better error messages with nested object support
 */
export const validationPipeConfig: ValidationPipeOptions = {
  // Strip properties that don't have decorators
  whitelist: true,

  // Throw error if non-whitelisted properties are present
  forbidNonWhitelisted: true,

  // Automatically transform payloads to DTO instances
  transform: true,

  // Transformation options for nested objects
  transformOptions: {
    // Automatically convert types (string to number, string to boolean, etc.)
    enableImplicitConversion: true,

    // Expose default values from class properties
    exposeDefaultValues: true,

    // Don't exclude extraneous values (whitelist handles this)
    excludeExtraneousValues: false,
  },

  // Validation options
  skipMissingProperties: false, // Don't skip validation for missing properties
  skipNullProperties: false, // Don't skip validation for null properties
  skipUndefinedProperties: false, // Don't skip validation for undefined properties

  // Error formatting
  validationError: {
    target: false, // Don't expose target object in error (security)
    value: true, // Expose the value that failed validation
  },

  // Continue validation after first error to show all errors
  stopAtFirstError: false,
};


