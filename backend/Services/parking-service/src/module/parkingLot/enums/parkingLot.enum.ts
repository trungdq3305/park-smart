// Định nghĩa các hằng số cho trạng thái và loại yêu cầu để dễ quản lý
export enum RequestType {
  CREATE = 'Tạo mới',
  UPDATE = 'Cập nhật',
  DELETE = 'Xóa',
}

export enum RequestStatus {
  PENDING = 'Đang chờ',
  APPROVED = 'Đã duyệt',
  REJECTED = 'Từ chối',
  APPLIED = 'Đã áp dụng', // Đã được CRON job thực thi thành công
  CANCELLED = 'Đã hủy', // Chủ bãi xe hủy yêu cầu
  FAILED = 'Thất bại', // CRON job thực thi thất bại
}
