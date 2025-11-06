import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { GetCurrentUserId } from 'src/common/decorators/getCurrentUserId.decorator'
import { Roles } from 'src/common/decorators/roles.decorator'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { PaginatedResponseDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { IdDto } from 'src/common/dto/params.dto'
import { RoleEnum } from 'src/common/enum/role.enum'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'
import { RolesGuard } from 'src/guard/role.guard'

// --- Thay đổi DTOs và Interface ---
import {
  CreateTieredRateSetDto,
  TieredRateSetResponseDto,
  UpdateTieredRateSetDto,
} from './dto/tieredRateSet.dto' // <-- Thay đổi
import { ITieredRateSetService } from './interfaces/itieredRateSet.service' // <-- Thay đổi

@Controller('tiered-rate-sets') // <-- Thay đổi
@ApiTags('tiered-rate-sets') // <-- Thay đổi
export class TieredRateSetController {
  constructor(
    @Inject(ITieredRateSetService) // <-- Thay đổi
    private readonly tieredRateSetService: ITieredRateSetService, // <-- Thay đổi
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo một bộ giá bậc thang (tiered rate set) mới' }) // <-- Thay đổi
  @ApiBody({ type: CreateTieredRateSetDto }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bộ giá đã được tạo thành công', // <-- Thay đổi
    type: ApiResponseDto<TieredRateSetResponseDto>, // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Lỗi trùng lặp (ví dụ: tên bộ giá đã tồn tại)', // <-- Thay đổi
  })
  async createSet(
    @Body() createDto: CreateTieredRateSetDto, // <-- Thay đổi
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<TieredRateSetResponseDto>> {
    // <-- Thay đổi
    const tieredRateSet = await this.tieredRateSetService.createSet(
      // <-- Thay đổi
      createDto,
      userId,
    )
    return {
      data: [tieredRateSet],
      statusCode: HttpStatus.CREATED,
      message: 'Bộ giá đã được tạo thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy tất cả bộ giá (Admin)', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách tất cả bộ giá', // <-- Thay đổi
    type: PaginatedResponseDto<TieredRateSetResponseDto>, // <-- Thay đổi
  })
  @ApiQuery({ name: 'page', required: true, type: Number })
  @ApiQuery({ name: 'pageSize', required: true, type: Number })
  async getAllSetsForAdmin(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<TieredRateSetResponseDto>> {
    // <-- Thay đổi
    const result = await this.tieredRateSetService.findAllSetsForAdmin(
      // <-- Thay đổi
      paginationQuery,
    )
    return {
      data: result.data,
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách bộ giá thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get('operator/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy tất cả bộ giá của người dùng hiện tại (operator)', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách bộ giá của người dùng hiện tại', // <-- Thay đổi
    type: PaginatedResponseDto<TieredRateSetResponseDto>, // <-- Thay đổi
  })
  @ApiQuery({ name: 'page', required: true, type: Number })
  @ApiQuery({ name: 'pageSize', required: true, type: Number })
  async getAllSetsByOperator(
    @GetCurrentUserId() userId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<TieredRateSetResponseDto>> {
    // <-- Thay đổi
    const result = await this.tieredRateSetService.findAllSetsByCreator(
      // <-- Thay đổi
      userId,
      paginationQuery,
    )
    return {
      data: result.data,
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách bộ giá thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin bộ giá theo ID' }) // <-- Thay đổi
  @ApiParam({ name: 'id', description: 'ID của bộ giá', type: 'string' }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin bộ giá thành công', // <-- Thay đổi
    type: ApiResponseDto<TieredRateSetResponseDto>, // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy bộ giá', // <-- Thay đổi
  })
  async getSetById(
    @Param() id: IdDto,
  ): Promise<ApiResponseDto<TieredRateSetResponseDto>> {
    // <-- Thay đổi
    const tieredRateSet = await this.tieredRateSetService.findSetById(id) // <-- Thay đổi
    return {
      data: [tieredRateSet],
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin bộ giá thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin bộ giá' }) // <-- Thay đổi
  @ApiParam({ name: 'id', description: 'ID của bộ giá', type: 'string' }) // <-- Thay đổi
  @ApiBody({ type: UpdateTieredRateSetDto }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thông tin bộ giá thành công', // <-- Thay đổi
    type: ApiResponseDto<TieredRateSetResponseDto>, // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy bộ giá', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Người dùng không có quyền cập nhật bộ giá này', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Bộ giá đang được sử dụng, không thể cập nhật', // <-- Thay đổi
  })
  async updateSet(
    @Param() id: IdDto,
    @Body() updateDto: UpdateTieredRateSetDto, // <-- Thay đổi
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<TieredRateSetResponseDto>> {
    // <-- Thay đổi
    const updatedSet = await this.tieredRateSetService.updateSet(
      // <-- Thay đổi
      id,
      updateDto,
      userId,
    )
    return {
      data: [updatedSet],
      statusCode: HttpStatus.OK,
      message: 'Cập nhật bộ giá thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa mềm bộ giá' }) // <-- Thay đổi
  @ApiParam({ name: 'id', description: 'ID của bộ giá', type: 'string' }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa mềm bộ giá thành công', // <-- Thay đổi
    type: ApiResponseDto<boolean>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy bộ giá', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Người dùng không có quyền xóa bộ giá này', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Bộ giá đang được sử dụng, không thể xóa', // <-- Thay đổi
  })
  async softDeleteSet(
    @Param() id: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const isDeleted = await this.tieredRateSetService.softDeleteSet(
      // <-- Thay đổi
      id,
      userId,
    )
    return {
      data: [isDeleted],
      statusCode: HttpStatus.OK,
      message: 'Xóa bộ giá thành công', // <-- Thay đổi
      success: true,
    }
  }
}
