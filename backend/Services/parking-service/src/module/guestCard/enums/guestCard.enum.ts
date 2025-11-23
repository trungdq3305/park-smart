// Trạng thái vòng đời của thẻ vật lý
export enum GuestCardStatus {
  ACTIVE = 'ACTIVE', // Thẻ đang hoạt động bình thường
  INACTIVE = 'INACTIVE', // Thẻ đang tạm ngưng (chưa phát hành hoặc thu hồi)
  LOST = 'LOST', // Thẻ đã bị báo mất (Hệ thống sẽ chặn nếu có người quẹt)
  DAMAGED = 'DAMAGED', // Thẻ bị hỏng vật lý (gãy, không đọc được chip)
  LOCKED = 'LOCKED', // Thẻ bị khóa do vi phạm quy chế hoặc nợ phí
}
