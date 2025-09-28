import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class NyOperatorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const nyOperatorHeader = request.headers['ny-operator'];

    // Check if ny-operator header exists and is not empty/whitespace only
    if (
      !nyOperatorHeader ||
      typeof nyOperatorHeader !== 'string' ||
      nyOperatorHeader.trim() === ''
    ) {
      throw new UnauthorizedException('ny-operator header required');
    }

    // Header is valid, allow access
    return true;
  }
}
