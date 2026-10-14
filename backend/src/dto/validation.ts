import { ValidationPipe } from '@nestjs/common';

/**
 * Shared validation rules for money fields.
 * Money crosses the wire as a string with up to 2 decimal places — never a float.
 */
export const DECIMAL_12_2_REGEX = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

export const DECIMAL_12_2_MESSAGE = 'value must be a decimal with up to 2 decimal places';

/** Standard options for all incoming DTOs. */
export const validationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
};

export const globalValidationPipe = new ValidationPipe(validationPipeOptions);
