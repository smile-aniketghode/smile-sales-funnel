import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { DynamoDbService } from '../../services/dynamodb.service';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly dynamoDbService: DynamoDbService) {}

  @Get()
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
}
