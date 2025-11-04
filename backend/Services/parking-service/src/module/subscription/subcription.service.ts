import { Injectable } from '@nestjs/common'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { IdDto } from 'src/common/dto/params.dto'

// Import các DTOs liên quan đến Subscription
import {
  CreateSubscriptionDto,
  SubscriptionDetailResponseDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto'
import { ISubscriptionRepository } from './interfaces/isubcription.repository'
import { ISubscriptionService } from './interfaces/isubcription.service'

@Injectable()
export class SubscriptionService implements ISubscriptionService {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  createSubscription(
    createDto: CreateSubscriptionDto,
    userId: string,
  ): Promise<SubscriptionDetailResponseDto> {
    throw new Error('Method not implemented.')
  }

  findAllByUserId(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{
    data: SubscriptionDetailResponseDto[]
    pagination: PaginationDto
  }> {
    throw new Error('Method not implemented.')
  }

  findSubscriptionById(
    id: IdDto,
    userId: string,
  ): Promise<SubscriptionDetailResponseDto> {
    throw new Error('Method not implemented.')
  }

  findActiveSubscriptionByIdentifier(
    subscriptionIdentifier: string,
  ): Promise<SubscriptionDetailResponseDto> {
    throw new Error('Method not implemented.')
  }

  cancelSubscription(id: IdDto, userId: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  renewSubscription(
    id: IdDto,
    userId: string,
  ): Promise<SubscriptionDetailResponseDto> {
    throw new Error('Method not implemented.')
  }

  updateSubscriptionByAdmin(
    id: IdDto,
    updateDto: UpdateSubscriptionDto,
  ): Promise<SubscriptionDetailResponseDto> {
    throw new Error('Method not implemented.')
  }
}
