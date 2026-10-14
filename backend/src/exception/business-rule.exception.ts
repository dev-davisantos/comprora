import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Thrown when a business rule is violated (e.g. invalid status transition).
 * Rendered as HTTP 400 by the global exception filter.
 */
export class BusinessRuleException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Business Rule Violation',
        message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
