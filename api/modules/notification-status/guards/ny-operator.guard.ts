import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { NY_OPERATOR_HEADER } from '../../../constants/headers.constants';

@Injectable()
export class NyOperatorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const nyOperatorHeader = request.headers[NY_OPERATOR_HEADER];

    // Check if ny-operator header exists and is not empty/whitespace only
    if (
      !nyOperatorHeader ||
      typeof nyOperatorHeader !== 'string' ||
      nyOperatorHeader.trim() === ''
    ) {
      throw new UnauthorizedException(`${NY_OPERATOR_HEADER} header required`);
    }

    // Header is valid, allow access
    return true;
  }
}
