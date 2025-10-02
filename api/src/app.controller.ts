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

  @Get('tasks/today')
  async getTodaysTasks(@Query('user_id') userId: string) {
    try {
      if (!userId) {
        throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
      }

      const tasks = await this.dynamoDbService.getTodaysTasks(userId);
      return {
        tasks,
        count: tasks.length,
        status: 'success'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch today's tasks: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('tasks')
  async getTasks(
    @Query('user_id') userId: string,
    @Query('status') status?: TaskStatus,
    @Query('limit') limit?: string,
    @Query('lastKey') lastKey?: string
  ) {
    try {
      if (!userId) {
        throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
      }

      const limitNum = limit ? parseInt(limit) : 50;
      const lastKeyObj = lastKey ? JSON.parse(lastKey) : undefined;

      const result = await this.dynamoDbService.getTasks(userId, status, limitNum, lastKeyObj);

      return {
        tasks: result.items,
        count: result.count,
        lastKey: result.lastKey,
        status: 'success'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch tasks: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('tasks/:id')
  async getTaskById(@Query('user_id') userId: string, @Param('id') id: string) {
    try {
      if (!userId) {
        throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
      }

      const task = await this.dynamoDbService.getTaskById(userId, id);

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

  @Get('deals/hot')
  async getHotDeals(@Query('user_id') userId: string) {
    try {
      if (!userId) {
        throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
      }

      const deals = await this.dynamoDbService.getHotDeals(userId);
      return {
        deals,
        count: deals.length,
        status: 'success'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch hot deals: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('deals')
  async getDeals(
    @Query('user_id') userId: string,
    @Query('status') status?: DealStatus,
    @Query('limit') limit?: string,
    @Query('lastKey') lastKey?: string
  ) {
    try {
      if (!userId) {
        throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
      }

      const limitNum = limit ? parseInt(limit) : 50;
      const lastKeyObj = lastKey ? JSON.parse(lastKey) : undefined;

      const result = await this.dynamoDbService.getDeals(userId, status, limitNum, lastKeyObj);

      return {
        deals: result.items,
        count: result.count,
        lastKey: result.lastKey,
        status: 'success'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch deals: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('deals/:id')
  async getDealById(@Query('user_id') userId: string, @Param('id') id: string) {
    try {
      if (!userId) {
        throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
      }

      const deal = await this.dynamoDbService.getDealById(userId, id);

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

  @Get('insights')
  async getInsights(@Query('user_id') userId: string) {
    try {
      if (!userId) {
        throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
      }

      const insights = await this.dynamoDbService.getInsights(userId);
      return {
        insights,
        count: insights.length,
        status: 'success'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch insights: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats/summary')
  async getStatsSummary(@Query('user_id') userId: string) {
    try {
      if (!userId) {
        throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
      }

      const stats = await this.dynamoDbService.getStats(userId);
      return { ...stats, status: 'success' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('contacts')
  async getContacts(@Query('user_id') userId: string, @Query('limit') limit?: string) {
    try {
      if (!userId) {
        throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
      }

      const limitNum = limit ? parseInt(limit) : 50;
      const contacts = await this.dynamoDbService.getContacts(userId, limitNum);

      return {
        contacts,
        count: contacts.length,
        status: 'success'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch contacts: ${error.message}`,
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