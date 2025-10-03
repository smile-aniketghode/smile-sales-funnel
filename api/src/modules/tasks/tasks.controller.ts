import { Controller, Get, Put, Param, Query, Body, HttpException, HttpStatus } from '@nestjs/common';
import { DynamoDbService } from '../../services/dynamodb.service';
import { TaskStatus, UpdateTaskDto } from '../../interfaces';

@Controller('tasks')
export class TasksController {
  constructor(private readonly dynamoDbService: DynamoDbService) {}

  @Get('today')
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

  @Get()
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

  @Get(':id')
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

  @Put(':id')
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
}
