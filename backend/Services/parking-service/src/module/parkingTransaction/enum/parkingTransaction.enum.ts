export enum TransactionTypeEnum {
  // --- NHÓM VÉ THÁNG (SUBSCRIPTION) ---
  SUBSCRIPTION_NEW = 'SUBSCRIPTION_NEW', // Mua mới
  SUBSCRIPTION_RENEW = 'SUBSCRIPTION_RENEW', // Gia hạn

  // --- NHÓM ĐẶT CHỖ (RESERVATION) ---
  RESERVATION_CREATE = 'RESERVATION_CREATE', // Đặt chỗ mới
  RESERVATION_EXTEND = 'RESERVATION_EXTEND', // Gia hạn giờ

  // --- NHÓM VÃNG LAI (WALK-IN) ---
  WALK_IN_PAYMENT = 'WALK_IN_PAYMENT', // Khách vãng lai trả tiền tại cổng/App

  // --- NHÓM HOÀN TIỀN & KHÁC ---
  REFUND = 'REFUND', // Hoàn tiền (cho bất kỳ loại nào)
  PENALTY = 'PENALTY', // Phạt vi phạm (nếu tách riêng)
}
