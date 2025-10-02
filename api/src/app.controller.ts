import { Controller, Get, Post, Put, Param, Query, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { DynamoDbService } from './services/dynamodb.service';
import { Task, Deal, TaskStatus, DealStatus, UpdateTaskDto, UpdateDealDto } from './interfaces';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dynamoDbService: DynamoDbService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('tasks')
  async getTasks(
    @Query('status') status?: TaskStatus,
    @Query('limit') limit?: string,
    @Query('lastKey') lastKey?: string
  ) {
    try {
      const limitNum = limit ? parseInt(limit) : 50;
      const lastKeyObj = lastKey ? JSON.parse(lastKey) : undefined;
      
      const result = await this.dynamoDbService.getTasks(status, limitNum, lastKeyObj);
      
      return {
        tasks: result.items,
        count: result.count,
        lastKey: result.lastKey,
        status: 'success'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch tasks: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('tasks/:id')
  async getTaskById(@Param('id') id: string) {
    try {
      const task = await this.dynamoDbService.getTaskById(id);
      
      if (!task) {
        throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
      }
      
      return { task, status: 'success' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch task: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('tasks/:id')
  async updateTask(@Param('id') id: string, @Body() updateData: UpdateTaskDto) {
    try {
      const success = await this.dynamoDbService.updateTask(id, updateData);
      
      if (!success) {
        throw new HttpException('Failed to update task', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      return { message: 'Task updated successfully', status: 'success' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to update task: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('deals')
  async getDeals(
    @Query('status') status?: DealStatus,
    @Query('limit') limit?: string,
    @Query('lastKey') lastKey?: string
  ) {
    try {
      const limitNum = limit ? parseInt(limit) : 50;
      const lastKeyObj = lastKey ? JSON.parse(lastKey) : undefined;
      
      const result = await this.dynamoDbService.getDeals(status, limitNum, lastKeyObj);
      
      return {
        deals: result.items,
        count: result.count,
        lastKey: result.lastKey,
        status: 'success'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch deals: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('deals/:id')
  async getDealById(@Param('id') id: string) {
    try {
      const deal = await this.dynamoDbService.getDealById(id);
      
      if (!deal) {
        throw new HttpException('Deal not found', HttpStatus.NOT_FOUND);
      }
      
      return { deal, status: 'success' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch deal: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('deals/:id')
  async updateDeal(@Param('id') id: string, @Body() updateData: UpdateDealDto) {
    try {
      const success = await this.dynamoDbService.updateDeal(id, updateData);
      
      if (!success) {
        throw new HttpException('Failed to update deal', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      return { message: 'Deal updated successfully', status: 'success' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to update deal: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('tasks/today')
  async getTodaysTasks() {
    try {
      const tasks = await this.dynamoDbService.getTodaysTasks();
      return {
        tasks,
        count: tasks.length,
        status: 'success'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch today's tasks: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('deals/hot')
  async getHotDeals() {
    try {
      const deals = await this.dynamoDbService.getHotDeals();
      return {
        deals,
        count: deals.length,
        status: 'success'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch hot deals: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats/summary')
  async getStatsSummary() {
    try {
      const stats = await this.dynamoDbService.getStats();
      return { ...stats, status: 'success' };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health')
  async healthCheck() {
    try {
      const dbHealth = await this.dynamoDbService.healthCheck();
      return {
        api: 'healthy',
        database: dbHealth,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        'Health check failed',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}