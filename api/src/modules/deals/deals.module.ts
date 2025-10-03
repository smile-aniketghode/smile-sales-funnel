import { Module } from '@nestjs/common';
import { DealsController } from './deals.controller';
import { DynamoDbService } from '../../services/dynamodb.service';

@Module({
  controllers: [DealsController],
  providers: [DynamoDbService],
})
export class DealsModule {}
