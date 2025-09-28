import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';

export const OperatorHeader = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request: Request = ctx.switchToHttp().getRequest();
    const operator = request.headers['ny-operator'] as string;

    if (!operator || operator.trim() === '') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Missing required header',
        details: 'ny-operator header is required',
      });
    }

    return operator.trim();
  },
);
