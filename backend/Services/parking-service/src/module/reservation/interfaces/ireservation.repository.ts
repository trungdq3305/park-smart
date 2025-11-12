import type { ClientSession } from 'mongoose'

import type {
  ConfirmReservationPaymentDto,
  CreateReservationDto,
} from '../dto/reservation.dto'
// Import DTO (Nếu dùng) hoặc Schema
import type { ReservationStatusEnum } from '../enums/reservation.enum'
import type { Reservation } from '../schemas/reservation.schema' // <-- Đường dẫn Schema

export interface IReservationRepository {
  /**
   * Tạo một đơn đặt chỗ (vé) mới.
   * (Được gọi sau khi Service đã kiểm tra 'BookingInventory' và xác thực thanh toán).
   * @param reservationData Dữ liệu đầy đủ (bao gồm userId, parkingLotId, status, v.v.)
   * @param session (Bắt buộc) Phiên làm việc của transaction.
   */
  createReservation(
    reservationData: Partial<CreateReservationDto>, // Service sẽ chuẩn bị dữ liệu này
    session: ClientSession,
  ): Promise<Reservation | null>

  /**
   * Tìm một đơn đặt chỗ bằng ID (bao gồm populate chi tiết).
   * (Dùng cho cả User xem chi tiết và Service kiểm tra).
   * @param id ID của đơn đặt chỗ.
   */
  findReservationById(id: string): Promise<Reservation | null>

  /**
   * (Rất quan trọng) Tìm một đơn đặt chỗ bằng 'paymentId'.
   * Dùng để kiểm tra xem "bằng chứng thanh toán" này đã được sử dụng hay chưa.
   * @param paymentId ID thanh toán từ .NET service.
   * @param session (Tùy chọn) Phiên làm việc của transaction.
   */
  findReservationByPaymentId(
    paymentId: string,
    session?: ClientSession,
  ): Promise<Reservation | null>

  /**
   * Tìm một đơn đặt chỗ hợp lệ (ví dụ: 'CONFIRMED') bằng ID của nó.
   * Dùng cho logic Check-in (khi người dùng quét mã QR của vé).
   * @param reservationIdentifier ID của đơn đặt chỗ.
   */
  findValidReservationForCheckIn(
    reservationIdentifier: string,
  ): Promise<Reservation | null>

  /**
   * Lấy danh sách tất cả đơn đặt chỗ của một người dùng (có phân trang).
   * Dùng cho màn hình "Các vé đặt trước của tôi".
   * @param userId ID của người dùng.
   * @param page Số trang.
   * @param pageSize Kích thước trang.
   */
  findAllByUserId(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Reservation[]; total: number }>

  /**
   * Cập nhật trạng thái của một đơn đặt chỗ (ví dụ: CONFIRMED -> CHECKED_IN).
   * @param id ID của đơn đặt chỗ.
   * @param status Trạng thái mới.
   * @param session (Bắt buộc) Phải chạy trong transaction (ví dụ: cùng với việc tạo ParkingSession).
   */
  updateReservationStatus(
    id: string,
    status: ReservationStatusEnum,
    session: ClientSession,
  ): Promise<boolean>

  /**
   * (Dùng cho Cron Job) Tìm và cập nhật tất cả các vé 'CONFIRMED'
   * đã quá hạn (ví dụ: 'userExpectedTime' đã qua 1 tiếng) sang 'EXPIRED'.
   * @param cutoffTime Thời gian "cắt" (ví dụ: 1 giờ trước).
   */
  expireOverdueReservations(
    cutoffTime: Date,
  ): Promise<{ modifiedCount: number; matchedCount: number }>

  /**
   * Cập nhật 'paymentId' cho một đơn đặt chỗ.
   * Dùng khi cần liên kết thanh toán sau khi tạo đơn đặt chỗ.
   * @param id ID của đơn đặt chỗ.
   * @param paymentId ID thanh toán từ .NET service.
   * @param session (Bắt buộc) Phải chạy trong transaction.
   */
  updateReservationPaymentId(
    id: string,
    updateData: ConfirmReservationPaymentDto,
    session: ClientSession,
  ): Promise<boolean>
}

export const IReservationRepository = Symbol('IReservationRepository')
