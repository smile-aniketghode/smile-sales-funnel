import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { DynamoDbService } from '../../services/dynamodb.service';

@Module({
  controllers: [TasksController],
  providers: [DynamoDbService],
})
export class TasksModule {}
