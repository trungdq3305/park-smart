import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { plainToInstance } from 'class-transformer'
import { ClientSession, Connection } from 'mongoose'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { IdDto } from 'src/common/dto/params.dto'

import {
  CreatePackageRateDto,
  PackageRateResponseDto,
  UpdatePackageRateDto,
} from './dto/packageRate.dto'
import { Unit } from './enums/packageRate.enum'
import { IPackageRateRepository } from './interfaces/ipackageRate.repository'
import { IPackageRateService } from './interfaces/ipackageRate.service'
import { PackageRate } from './schemas/packageRate.schema'
@Injectable()
export class PackageRateService implements IPackageRateService {
  constructor(
    @Inject(IPackageRateRepository)
    private readonly packageRateRepository: IPackageRateRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private returnPackageRateResponseDto(
    packageRate: PackageRate,
  ): PackageRateResponseDto {
    return plainToInstance(PackageRateResponseDto, packageRate, {
      excludeExtraneousValues: true,
    })
  }

  private checkNameConflict(name: string, userId: string): Promise<boolean> {
    return this.packageRateRepository.findPackageRateByNameAndCreator(
      name,
      userId,
    )
  }

  private async checkConditionBeforeChange(id: string, userId: string) {
    const existingPackageRate =
      await this.packageRateRepository.findPackageRateByIdAndCreator(id, userId)

    if (!existingPackageRate) {
      // Lỗi này giờ có 2 nghĩa:
      // 1. Gói cước không tồn tại
      // 2. Gói cước tồn tại nhưng không phải của bạn
      throw new NotFoundException(
        'Gói cước không tồn tại hoặc bạn không có quyền truy cập',
      )
    }
  }

  findAllEnumPackageRates(): Promise<any[]> {
    // 1. Lấy ra mảng các giá trị: ['Giờ', 'Ngày', 'Tuần', 'Tháng']
    const values = Object.values(Unit)

    // 2. Dùng .map() để biến đổi từng 'item' trong mảng
    const formattedData = values.map((item) => {
      // Trả về một đối tượng mới với key là "unit"
      return { unit: item }
    })

    // 3. Trả về mảng đã được định dạng
    return Promise.resolve(formattedData)
  }

  async findAllPackageRates(
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: PackageRateResponseDto[]; pagination: PaginationDto }> {
    const { page, pageSize } = paginationQuery
    const packageRates = await this.packageRateRepository.findAllPackageRates(
      page,
      pageSize,
    )
    if (packageRates.data.length === 0) {
      throw new NotFoundException('Chưa có gói cước nào được tạo')
    }
    return {
      data: packageRates.data.map((packageRate) =>
        this.returnPackageRateResponseDto(packageRate),
      ),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: packageRates.total,
        totalPages: Math.ceil(packageRates.total / pageSize),
      },
    }
  }

  async createPackageRate(
    createDto: CreatePackageRateDto,
    userId: string,
    externalSession?: ClientSession, // Nhận session từ createPolicy
  ): Promise<PackageRateResponseDto> {
    // 1. Xử lý Session
    const session = externalSession ?? (await this.connection.startSession())
    if (!externalSession) {
      session.startTransaction()
    }

    try {

      // 2. Truyền session vào Repository
      const data = await this.packageRateRepository.createPackageRate(
        createDto,
        userId,
        session, // <--- QUAN TRỌNG: Phải truyền vào đây
      )

      if (!data) {
        throw new InternalServerErrorException('Tạo gói cước thất bại')
      }

      // 3. Chỉ commit nếu session là nội bộ
      if (!externalSession) {
        await session.commitTransaction()
      }

      return this.returnPackageRateResponseDto(data)
    } catch (error) {
      // 4. Chỉ abort nếu session là nội bộ
      if (!externalSession) {
        await session.abortTransaction()
      }

      if (
        error instanceof InternalServerErrorException ||
        error instanceof ConflictException
      ) {
        throw error
      }

      throw new InternalServerErrorException('Đã có lỗi không xác định xảy ra.')
    } finally {
      // 5. Chỉ end session nếu session là nội bộ
      if (!externalSession) {
        await session.endSession()
      }
    }
  }

  async updatePackageRate(
    id: IdDto,
    updateDto: UpdatePackageRateDto,
    userId: string,
  ): Promise<PackageRateResponseDto> {
    await this.checkConditionBeforeChange(id.id, userId)
    const isNameConflict = await this.checkNameConflict(updateDto.name, userId)
    if (isNameConflict) {
      throw new ConflictException('Tên gói cước đã tồn tại')
    }
    const updatedPackageRate =
      await this.packageRateRepository.updatePackageRate(
        id.id,
        updateDto,
        userId,
      )

    if (!updatedPackageRate) {
      throw new InternalServerErrorException('Cập nhật gói cước thất bại')
    }

    return this.returnPackageRateResponseDto(updatedPackageRate)
  }

  async findPackageRateById(id: IdDto): Promise<PackageRateResponseDto> {
    const packageRate = await this.packageRateRepository.findPackageRateById(
      id.id,
    )
    if (!packageRate) {
      throw new NotFoundException('Gói cước không tồn tại')
    }
    return this.returnPackageRateResponseDto(packageRate)
  }

  async findAllPackageRatesByCreator(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: PackageRateResponseDto[]; pagination: PaginationDto }> {
    const { page, pageSize } = paginationQuery
    const result =
      await this.packageRateRepository.findAllPackageRatesByCreator(
        userId,
        page,
        pageSize,
      )
    const data = result.data
    const totalItems = result.total
    if (data.length === 0) {
      throw new NotFoundException('Chưa có gói cước nào được tạo')
    }
    return {
      data: data.map((packageRate) =>
        this.returnPackageRateResponseDto(packageRate),
      ),
      pagination: {
        totalItems,
        currentPage: page,
        pageSize: pageSize,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    }
  }

  async softDeletePackageRate(id: IdDto, userId: string): Promise<boolean> {
    await this.checkConditionBeforeChange(id.id, userId)
    const result = await this.packageRateRepository.softDeletePackageRate(
      id.id,
      userId,
    )
    if (!result) {
      throw new InternalServerErrorException('Xóa gói cước thất bại')
    }
    return result
  }
}
