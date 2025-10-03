import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { DynamoDbService } from '../../services/dynamodb.service';

@Module({
  controllers: [ContactsController],
  providers: [DynamoDbService],
})
export class ContactsModule {}
