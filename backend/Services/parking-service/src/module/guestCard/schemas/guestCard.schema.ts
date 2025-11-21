import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

import { GuestCardStatus } from '../enums/guestCard.enum'

export type GuestCardDocument = HydratedDocument<GuestCard>
// 1. Bỏ unique ở từng trường đơn lẻ
@Schema()
export class GuestCard extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({ required: true })
  nfcUid: string // 👈 KHÔNG để unique: true ở đây nữa

  @Prop({ required: true })
  code: string // Mã định danh (CARD_001), cũng nên bỏ unique toàn cục

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, index: true })
  parkingLotId: string // ID của bãi xe sở hữu thẻ này

  @Prop({
    default: GuestCardStatus.ACTIVE,
    required: true,
    type: String,
    enum: Object.values(GuestCardStatus),
  })
  status: GuestCardStatus
}

export const GuestCardSchema = SchemaFactory.createForClass(GuestCard)

// 2. TẠO COMPOUND INDEX (CHÌA KHÓA KÉP)
GuestCardSchema.index(
  { nfcUid: 1, parkingLotId: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: { $eq: null } }, // 👈 ĐIỂM MẤU CHỐT
  },
)

// 2. Index Unique cho code + parkingLotId
// Cũng chỉ áp dụng khi chưa xóa
GuestCardSchema.index(
  { code: 1, parkingLotId: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: { $eq: null } },
  },
)
