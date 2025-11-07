import { ConflictException, Inject, Injectable } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { IdDto } from 'src/common/dto/params.dto'

import { IAccountServiceClient } from '../client/interfaces/iaccount-service-client'
// Import các DTOs liên quan đến Subscription
import {
  CreateSubscriptionDto,
  SubscriptionDetailResponseDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto'
import { ISubscriptionRepository } from './interfaces/isubcription.repository'
import { ISubscriptionService } from './interfaces/isubcription.service'
import { Subscription } from './schemas/subscription.schema'
@Injectable()
export class SubscriptionService implements ISubscriptionService {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(IAccountServiceClient)
    private readonly accountServiceClient: IAccountServiceClient,
  ) {}

  private returnToDto(
    subscription: Subscription,
  ): SubscriptionDetailResponseDto {
    return plainToInstance(SubscriptionDetailResponseDto, subscription, {
      excludeExtraneousValues: true,
    })
  }

  async createSubscription(
    createDto: CreateSubscriptionDto,
    userId: string,
  ): Promise<SubscriptionDetailResponseDto> {
    const checkPaymentStatus =
      await this.accountServiceClient.getPaymentStatusByExternalId(
        createDto.externalId,
      )
    if (!checkPaymentStatus) {
      throw new ConflictException('Đơn hàng chưa được thanh toán')
    }
    const newSubscription =
      await this.subscriptionRepository.createSubscription(createDto, userId)
    if (!newSubscription) {
      throw new ConflictException('Tạo gói đăng ký thất bại')
    }
    return this.returnToDto(newSubscription)
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
