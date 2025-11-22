 
 
 
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { plainToInstance } from 'class-transformer'
import { Connection } from 'mongoose'
import { PaginatedResponseDto } from 'src/common/dto/paginatedResponse.dto'

import {
  BulkCreateGuestCardsDto,
  BulkImportResultDto,
  CreateGuestCardDto,
  GuestCardResponseDto,
  UpdateGuestCardDto,
} from './dto/guestCard.dto'
import { GuestCardStatus } from './enums/guestCard.enum'
import { MongoWriteError } from './guestCard.repository'
import { IGuestCardRepository } from './interfaces/iguestCard.repository'
import { IGuestCardService } from './interfaces/iguestCard.service'
import { GuestCard } from './schemas/guestCard.schema'

@Injectable()
export class GuestCardService implements IGuestCardService {
  constructor(
    @Inject(IGuestCardRepository)
    private readonly guestCardRepository: IGuestCardRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async updateGuestCardStatus(
    id: string,
    status: string,
    userId: string,
  ): Promise<GuestCardResponseDto> {
    const data = await this.guestCardRepository.updateStatusById(
      id,
      status,
      userId,
    )
    if (!data) {
      throw new NotFoundException(`Không tìm thấy thẻ khách với ID: ${id}`)
    }
    return this.guestCardResponseDto(data)
  }

  private guestCardResponseDto(guestCard: GuestCard): GuestCardResponseDto {
    return plainToInstance(GuestCardResponseDto, guestCard, {
      excludeExtraneousValues: true,
    })
  }

  private BulkImportResultDto(guestCard: GuestCard): BulkImportResultDto {
    return plainToInstance(BulkImportResultDto, guestCard, {
      excludeExtraneousValues: true,
    })
  }

  async createGuestCard(
    createGuestCardDto: CreateGuestCardDto,
    userId: string,
  ): Promise<GuestCardResponseDto> {
    const session = await this.connection.startSession()
    session.startTransaction()
    try {
      const exists = await this.guestCardRepository.findGuestCardByNfcUid(
        createGuestCardDto.nfcUid,
        createGuestCardDto.parkingLotId,
      )
      if (exists) {
        throw new ConflictException(
          `Thẻ có UID ${createGuestCardDto.nfcUid} đã tồn tại trong bãi xe này!`,
        )
      }
      const newGuestCard = await this.guestCardRepository.createGuestCard(
        {
          ...createGuestCardDto,
          createdBy: userId,
          updatedBy: userId,
        },
        session,
      )
      await session.commitTransaction()
      return this.guestCardResponseDto(newGuestCard)
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      await session.endSession()
    }
  }

  async bulkCreateGuestCards(
    bulkDto: BulkCreateGuestCardsDto,
    userId: string,
  ): Promise<BulkImportResultDto> {
    // Lưu ý: Với bulk insert cho phép lỗi (Partial Success), ta KHÔNG dùng Transaction
    // để tránh việc 1 lỗi làm rollback toàn bộ các thẻ hợp lệ khác.

    const { parkingLotId, cards } = bulkDto

    // 1. Chuẩn bị dữ liệu
    const cardsToInsert = cards.map((card) => ({
      ...card,
      parkingLotId,
      status: 'ACTIVE', // Default status
      createdBy: userId, // Audit info
      updatedBy: userId, // Audit info
    }))

    // 2. Gọi Repo với chế độ ordered: false (cho phép lỗi)
    const { successes, errors } =
      await this.guestCardRepository.bulkInsertAllowingFailures(
        cardsToInsert as Partial<GuestCard>[],
      )

    // 3. Xử lý danh sách lỗi để báo cáo chi tiết
    // Đảm bảo errors là mảng trước khi map
    const safeErrors = Array.isArray(errors) ? errors : []

    const failures = safeErrors.map((err: MongoWriteError) => {
      // err.op chứa dữ liệu gốc bị lỗi
      // err.code = 11000 là lỗi trùng lặp
      const failedItem = err.op || {}
      let reason = 'Lỗi không xác định'

      if (err.code === 11000) {
        // Phân tích xem trùng field nào (nfcUid hay code) dựa vào message lỗi
        if (err.errmsg?.includes('nfcUid')) {
          reason = `Trùng mã chip NFC (${failedItem.nfcUid ?? 'N/A'})`
        } else if (err.errmsg?.includes('code')) {
          reason = `Trùng mã định danh (${failedItem.code ?? 'N/A'})`
        } else {
          reason = 'Dữ liệu đã tồn tại (Trùng lặp)'
        }
      } else {
        reason = err.errmsg ?? 'Lỗi lưu trữ'
      }

      return {
        nfcUid: failedItem.nfcUid ?? 'Unknown',
        code: failedItem.code ?? 'Unknown',
        reason: reason,
      }
    })

    // 4. Trả về kết quả tổng hợp
    // ⚠️ QUAN TRỌNG: Kiểm tra mảng trước khi map để tránh lỗi "map is not a function"
    const safeSuccesses = Array.isArray(successes) ? successes : []

    return {
      totalRequest: cards.length,
      successCount: safeSuccesses.length,
      failureCount: failures.length,
      // 👇 SỬA TÊN HÀM: dùng mapToDto thay vì guestCardResponseDto
      successItems: safeSuccesses.map((card) =>
        this.guestCardResponseDto(card),
      ),
      failures: failures,
    }
  }

  async findAllGuestCards(
    parkingLotId: string,
    page: number,
    pageSize: number,
    status?: string,
  ): Promise<PaginatedResponseDto<GuestCardResponseDto>> {
    const { data, total } =
      await this.guestCardRepository.findAllGuestCardsByParkingLot(
        parkingLotId,
        page,
        pageSize,
        status,
      )
    return {
      data: data.map((card) => this.guestCardResponseDto(card)),
      pagination: {
        totalPages: Math.ceil(total / pageSize),
        pageSize,
        totalItems: total,
        currentPage: page,
      },
      message: 'Lấy danh sách thẻ khách thành công',
      statusCode: 200,
      success: true,
    }
  }

  async findGuestCardById(id: string): Promise<GuestCardResponseDto> {
    const guestCard = await this.guestCardRepository.findGuestCardById(id)
    if (!guestCard) {
      throw new NotFoundException(`Không tìm thấy thẻ khách với ID: ${id}`)
    }
    return this.guestCardResponseDto(guestCard)
  }

  async findGuestCardByNfc(
    nfcUid: string,
    parkingLotId: string,
  ): Promise<GuestCardResponseDto | null> {
    const guestCard = await this.guestCardRepository.findGuestCardByNfcUid(
      nfcUid,
      parkingLotId,
    )
    if (!guestCard) {
      throw new NotFoundException(
        `Không tìm thấy thẻ khách với NFC UID: ${nfcUid} trong bãi xe của bạn`,
      )
    }
    return this.guestCardResponseDto(guestCard)
  }

  async updateGuestCard(
    id: string,
    updateGuestCardDto: UpdateGuestCardDto,
    userId: string,
  ): Promise<GuestCardResponseDto> {
    // 1. Chuyển DTO thành Plain Object và thêm thông tin audit
    // Việc spread (...) giúp TypeScript hiểu đây là object thường, tương thích với Partial<GuestCard>
    const updateData = {
      ...updateGuestCardDto,
      updatedBy: userId,
    }

    // 2. Gọi Repo update trực tiếp (Repo trả về null nếu không tìm thấy)
    // Không cần findById trước để tiết kiệm 1 query
    const updatedGuestCard = await this.guestCardRepository.updateGuestCard(
      id,
      updateData,
    )

    if (!updatedGuestCard) {
      throw new NotFoundException(`Không tìm thấy thẻ khách với ID: ${id}`)
    }

    return this.guestCardResponseDto(updatedGuestCard)
  }

  softDeleteGuestCard(id: string, userId: string): Promise<boolean> {
    return this.guestCardRepository.softDeleteGuestCard(id, userId)
  }
}
