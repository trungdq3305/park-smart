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
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { GetCurrentUserId } from 'src/common/decorators/getCurrentUserId.decorator'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { IdDto } from 'src/common/dto/params.dto'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'

import {
  AddressResponseDto,
  CreateAddressDto,
  UpdateAddressDto,
} from './dto/address.dto'
import { IAddressService } from './interfaces/iaddress.service'

@ApiTags('address')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressController {
  constructor(
    @Inject(IAddressService)
    private readonly addressService: IAddressService,
  ) {}

  @Post()
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: ApiResponseDto<AddressResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Tạo địa chỉ thất bại',
  })
  @ApiBody({ type: CreateAddressDto })
  @ApiOperation({ summary: 'Tạo một địa chỉ mới' })
  async create(
    @Body() createAddressDto: CreateAddressDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<AddressResponseDto>> {
    const address = await this.addressService.createAddress(
      createAddressDto,
      userId,
    )
    return {
      data: [address],
      message: 'Tạo địa chỉ thành công',
      statusCode: HttpStatus.CREATED,
      success: true,
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả địa chỉ' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ApiResponseDto<AddressResponseDto[]>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy địa chỉ nào',
  })
  async findAll(): Promise<ApiResponseDto<AddressResponseDto[]>> {
    // Giả sử bạn có hàm findAllAddressesByUserId trong service
    const addresses = await this.addressService.findAllAddresses()
    return {
      data: [addresses],
      message: 'Lấy danh sách địa chỉ thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tìm một địa chỉ theo ID' })
  @ApiParam({ name: 'id', description: 'ID của địa chỉ cần tìm' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ApiResponseDto<AddressResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Địa chỉ không tồn tại',
  })
  async findById(
    @Param() parameters: IdDto,
  ): Promise<ApiResponseDto<AddressResponseDto>> {
    const address = await this.addressService.findAddressById(parameters.id)
    return {
      data: [address],
      message: 'Tìm địa chỉ thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật một địa chỉ theo ID' })
  @ApiParam({ name: 'id', description: 'ID của địa chỉ cần cập nhật' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ApiResponseDto<AddressResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Địa chỉ không tồn tại',
  })
  async update(
    @Param() parameters: IdDto,
    @Body() updateAddressDto: UpdateAddressDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<AddressResponseDto>> {
    const updatedAddress = await this.addressService.updateAddress(
      parameters.id,
      updateAddressDto,
      userId,
    )
    return {
      data: [updatedAddress],
      message: 'Cập nhật địa chỉ thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'ID của địa chỉ cần cập nhật' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ApiResponseDto<boolean>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Địa chỉ không tồn tại',
  })
  @ApiOperation({ summary: 'Xóa một địa chỉ theo ID' })
  async delete(
    @Param() parameters: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const result = await this.addressService.deleteAddress(
      parameters.id,
      userId,
    )
    return {
      data: [result],
      message: 'Xóa địa chỉ thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }
}
