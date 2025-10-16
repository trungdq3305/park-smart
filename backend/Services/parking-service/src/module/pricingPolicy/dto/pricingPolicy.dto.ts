// import { ApiProperty } from '@nestjs/swagger'
// import { Exclude, Expose, Transform, Type } from 'class-transformer'
// import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator'

// --- DTO for Request Bodies ---
export class CreatePricingPolicyDto {
  // @ApiProperty({ example: '29 Lê Duẩn' })
  // @IsNotEmpty()
  // @IsString()
  // fullAddress: string
  // @ApiProperty({ example: '605e3f5f4f3e8c1d4c9f1e1a' })
  // @IsNotEmpty()
  // @IsMongoId()
  // wardId: string
}

export class UpdatePricingPolicyDto {
  // @ApiProperty({ example: '30 Nguyễn Huệ', required: false })
  // @IsOptional()
  // @IsString()
  // fullAddress: string
  // @ApiProperty({ example: '605e3f5f4f3e8c1d4c9f1e1b', required: false })
  // @IsOptional()
  // @IsMongoId()
  // wardId: string
}

// --- DTO for Responses ---
export class PricingPolicyResponseDto {
  // @ApiProperty({ example: '29 Lê Duẩn' })
  // @IsNotEmpty()
  // @IsString()
  // fullAddress: string
  // @ApiProperty({ example: '605e3f5f4f3e8c1d4c9f1e1a' })
  // @IsNotEmpty()
  // @IsMongoId()
  // wardId: string
}
