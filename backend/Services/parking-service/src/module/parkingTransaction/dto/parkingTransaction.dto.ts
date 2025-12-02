export class TransactionFilterDto {
  parkingLotId?: string
  type?: string // SUBSCRIPTION_NEW, REFUND...
  startDate?: Date // Tìm từ ngày
  endDate?: Date // Đến ngày
  paymentId?: string
}
