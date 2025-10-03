import { Controller, Get, Put, Param, Query, Body, HttpException, HttpStatus } from '@nestjs/common';
import { DynamoDbService } from '../../services/dynamodb.service';
import { DealStatus, UpdateDealDto } from '../../interfaces';

@Controller('deals')
export class DealsController {
  constructor(private readonly dynamoDbService: DynamoDbService) {}

  @Get('hot')
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

  @Get()
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

  @Get(':id')
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

  @Put(':id')
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
}
