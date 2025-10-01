import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { NY_OPERATOR_HEADER } from '../../constants/headers.constants';

export const OperatorHeader = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request: Request = ctx.switchToHttp().getRequest();
    const operator = request.headers[NY_OPERATOR_HEADER] as string;

    if (!operator || operator.trim() === '') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Missing required header',
        details: `${NY_OPERATOR_HEADER} header is required`,
      });
    }

    return operator.trim();
  },
);
