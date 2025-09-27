import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiErrorCode } from './error-codes';

export class BaseApiException extends HttpException {
  constructor(
    message: string,
    errorCode: ApiErrorCode,
    statusCode: HttpStatus,
  ) {
    super({ message, errorCode }, statusCode);
  }
}
