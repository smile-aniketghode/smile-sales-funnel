import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'SMILe Sales Funnel API - Phase 0';
  }
}