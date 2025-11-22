// Định nghĩa các hằng số cho trạng thái và loại yêu cầu để dễ quản lý
export enum RequestType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum RequestStatus {
  APPLIED = 'APPLIED', // Đã được CRON job thực thi thành công
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED', // Chủ bãi xe hủy yêu cầu
  FAILED = 'FAILED', // CRON job thực thi thất bại
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
}
