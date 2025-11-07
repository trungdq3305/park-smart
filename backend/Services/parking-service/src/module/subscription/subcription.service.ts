import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { plainToInstance } from 'class-transformer'
import { Connection } from 'mongoose'
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
import { SubscriptionTransactionType } from './enums/subscription.enum'
import { ISubscriptionRepository } from './interfaces/isubcription.repository'
import { ISubscriptionService } from './interfaces/isubcription.service'
import { ISubscriptionLogRepository } from './interfaces/isubcriptionLog.repository'
import { Subscription } from './schemas/subscription.schema'
@Injectable()
export class SubscriptionService implements ISubscriptionService {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(IAccountServiceClient)
    private readonly accountServiceClient: IAccountServiceClient,
    @InjectConnection()
    private readonly connection: Connection,
    @Inject(ISubscriptionLogRepository)
    private readonly subscriptionLogRepository: ISubscriptionLogRepository,
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
    const session = await this.connection.startSession()
    session.startTransaction()
    try {
      const checkPaymentStatus =
        await this.accountServiceClient.getPaymentStatusByPaymentId(
          createDto.paymentId,
        )
      if (!checkPaymentStatus) {
        throw new ConflictException('Vé chưa được thanh toán')
      }
      const newSubscription =
        await this.subscriptionRepository.createSubscription(
          createDto,
          userId,
          session,
        )

      if (!newSubscription) {
        throw new InternalServerErrorException('Không thể tạo gói thuê bao.')
      }

      const dataForLog = {
        paymentId: createDto.paymentId,
        subscriptionId: newSubscription._id,
        extendedUntil: newSubscription.endDate,
        transactionType: SubscriptionTransactionType.INITIAL_PURCHASE,
      }

      await this.subscriptionLogRepository.createLog(dataForLog, session)

      await session.commitTransaction()

      return this.returnToDto(newSubscription)
    } catch (error) {
      await session.abortTransaction()
      if (error.code === 11000) {
        // Dịch lỗi CSDL thành lỗi 409 (Conflict) thân thiện
        throw new ConflictException(
          'Thanh toán này đã được sử dụng cho một gói thuê bao khác.',
        )
      }
      throw error
    } finally {
      await session.endSession()
    }
  }

  async findAllByUserId(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{
    data: SubscriptionDetailResponseDto[]
    pagination: PaginationDto
  }> {
    const { page, pageSize } = paginationQuery
    const data = await this.subscriptionRepository.findAllByUserId(
      userId,
      page,
      pageSize,
    )

    if (data.data.length === 0) {
      throw new ConflictException('Người dùng chưa có gói đăng ký nào')
    }

    return {
      data: data.data.map((s) => this.returnToDto(s)),
      pagination: {
        totalItems: data.total,
        currentPage: paginationQuery.page,
        pageSize: paginationQuery.pageSize,
        totalPages: Math.ceil(data.total / paginationQuery.pageSize),
      },
    }
  }

  async findSubscriptionById(
    id: IdDto,
    userId: string,
  ): Promise<SubscriptionDetailResponseDto> {
    const subscription = await this.subscriptionRepository.findSubscriptionById(
      id.id,
      userId,
    )
    if (!subscription) {
      throw new ConflictException('Gói đăng ký không tồn tại')
    }
    return this.returnToDto(subscription)
  }

  async findActiveSubscriptionByIdentifier(
    subscriptionIdentifier: string,
  ): Promise<SubscriptionDetailResponseDto> {
    const subscription =
      await this.subscriptionRepository.findActiveSubscriptionByIdentifier(
        subscriptionIdentifier,
      )
    if (!subscription) {
      throw new ConflictException(
        'Gói đăng ký không tồn tại hoặc không còn hiệu lực',
      )
    }
    return this.returnToDto(subscription)
  }

  cancelSubscription(id: IdDto, userId: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  renewSubscription(
    id: IdDto,
    paymentId: string,
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
