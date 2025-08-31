import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('tasks')
  getTasks() {
    return { tasks: [], message: 'Tasks endpoint - stub implementation' };
  }

  @Get('deals')
  getDeals() {
    return { deals: [], message: 'Deals endpoint - stub implementation' };
  }
}