import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  Inject,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { IAddressService } from './interfaces/iaddress.service'
import { Address } from './schemas/address.schema'
import { CreateAddressDto } from './dto/createAddress.dto'
import { UpdateAddressDto } from './dto/updateAddress.dto'
import { AddressResponseDto } from './dto/addressResponse.dto'

@ApiTags('address')
@Controller('addresses')
@UseGuards(JwtAuthGuard) // Bảo vệ tất cả các route trong controller này
@ApiBearerAuth() // Yêu cầu token xác thực trong Swagger UI
export class AddressController {
  constructor(
    @Inject(IAddressService)
    private readonly addressService: IAddressService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo một địa chỉ mới cho người dùng đã đăng nhập' })
  @ApiResponse({
    status: 201,
    description: 'Tạo địa chỉ thành công.',
    type: Address, // Swagger sẽ hiển thị schema của Address
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực.' })
  create(
    @Body() createAddressDto: CreateAddressDto,
    @Req() req: any, // Dùng 'any' hoặc một interface Request đã được mở rộng
  ): Promise<ApiResponseDto<AddressResponseDto>> {
    const userId = req.user?.id || req.user?._id // Lấy userId từ token đã được giải mã
    return this.addressService.createAddress(createAddressDto, userId)
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả địa chỉ' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách địa chỉ thành công.',
    type: [Address], // Swagger sẽ hiển thị một mảng các Address
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực.' })
  findAll(): Promise<ApiResponseDto<AddressResponseDto>> {
    // Lưu ý: Dựa trên interface, hàm này lấy TẤT CẢ địa chỉ.
    // Nếu bạn muốn lấy địa chỉ của riêng người dùng, bạn cần sửa lại service.
    return this.addressService.findAllAddresses()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tìm một địa chỉ theo ID' })
  @ApiParam({ name: 'id', description: 'ID của địa chỉ cần tìm' })
  @ApiResponse({
    status: 200,
    description: 'Tìm địa chỉ thành công.',
    type: Address,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy địa chỉ.' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực.' })
  findById(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<AddressResponseDto>> {
    return this.addressService.findAddressById(id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật một địa chỉ theo ID' })
  @ApiParam({ name: 'id', description: 'ID của địa chỉ cần cập nhật' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật địa chỉ thành công.',
    type: Address,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy địa chỉ.' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền cập nhật địa chỉ này.',
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực.' })
  update(
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<AddressResponseDto>> {
    const userId = req.user?.id || req.user?._id
    return this.addressService.updateAddress(id, updateAddressDto, userId)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa một địa chỉ theo ID' })
  @ApiParam({ name: 'id', description: 'ID của địa chỉ cần xóa' })
  @ApiResponse({
    status: 200,
    description: 'Xóa địa chỉ thành công.',
    type: Boolean,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy địa chỉ.' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa địa chỉ này.' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực.' })
  delete(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ApiResponseDto<boolean>> {
    const userId = req.user?.id || req.user?._id
    return this.addressService.deleteAddress(id, userId)
  }
}
