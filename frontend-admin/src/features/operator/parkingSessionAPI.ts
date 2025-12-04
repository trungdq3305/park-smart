import { apiSlice } from '../../apis/apiSlice' // Điều chỉnh đường dẫn import nếu cần

export const parkingLotSessionAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Check-in (Có upload ảnh)
    checkIn: builder.mutation({
      query: ({ parkingLotId, formData }) => ({
        url: `/parking/parking-sessions/check-in/${parkingLotId}`,
        method: 'POST',
        body: formData,
        // Lưu ý: Khi gửi FormData, không cần set Content-Type header,
        // trình duyệt sẽ tự động thêm boundary.
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['ParkingSession'], // Cập nhật lại danh sách session nếu đang xem
    }),

    // 2. Tính phí Check-out
    calculateCheckoutFee: builder.mutation({
      query: ({ parkingLotId, data }) => ({
        url: `/parking/parking-sessions/check-out/calculate-fee/${parkingLotId}`,
        method: 'POST',
        body: data, // { identifier, uidCard, pricingPolicyId }
      }),
      transformResponse: (res) => res,
    }),

    // 3. Xác nhận Check-out (Thanh toán xong)
    confirmCheckout: builder.mutation({
      query: ({ sessionId, formData }) => ({
        // 👈 Đổi tham số thành formData
        url: `/parking/parking-sessions/check-out/confirm/${sessionId}`,
        method: 'POST',
        body: formData, // 👈 Gửi body là FormData
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['ParkingSession'],
    }),

    // 4. Kiểm tra trạng thái xe (Vào hay Ra)
    checkSessionStatus: builder.query({
      query: ({ parkingLotId, identifier, nfcUid }) => {
        // 👇 TẠO OBJECT PARAMS ĐỘNG
        // Chỉ thêm key vào nếu giá trị tồn tại (khác null/undefined/empty)
        const params: any = { parkingLotId }

        if (nfcUid) {
          params.nfcUid = nfcUid
        }

        if (identifier) {
          params.identifier = identifier
        }

        return {
          url: '/parking/parking-sessions/status/check', // Đảm bảo đúng prefix /parking nếu bạn có dùng global prefix
          method: 'GET',
          params: params, // Gửi object đã lọc sạch
        }
      },
      transformResponse: (res) => res,
      keepUnusedDataFor: 0,
    }),

    // 5. Lịch sử cá nhân (Driver)
    getMyParkingHistory: builder.query({
      query: (params) => ({
        url: '/parking/parking-sessions/my-history',
        method: 'GET',
        params: params, // { page, pageSize }
      }),
      transformResponse: (res) => res,
      providesTags: ['ParkingSession'],
    }),

    // 6. Lịch sử bãi xe (Admin/Operator)
    getParkingLotHistory: builder.query({
      query: ({ parkingLotId, params }) => ({
        url: `/parking/parking-sessions/history/${parkingLotId}`,
        method: 'GET',
        params: params, // { page, pageSize }
      }),
      transformResponse: (res) => res,
      providesTags: ['ParkingSession'],
    }),

    // 7. Chi tiết phiên (Kèm ảnh)
    getSessionDetails: builder.query({
      query: (sessionId) => ({
        url: `/parking/parking-sessions/${sessionId}/details`,
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['ParkingSession'],
    }),

    getActivePricingPolicies: builder.query({
      query: (parkingLotId) => ({
        url: `/parking/parking-lot-links/active/by-parking-lot/${parkingLotId}`,
        method: 'GET',
      }),
      transformResponse: (res: any) => res.data, // Chỉ lấy mảng data[]
    }),
    getParkingSessionHistory: builder.query({
      query: ({ parkingLotId, params }) => ({
        url: `/parking/parking-sessions/history/${parkingLotId}`,
        method: 'GET',
        params: params, // { page, pageSize }
      }),
      transformResponse: (res) => res,
      providesTags: ['ParkingSession'],
    }),
    getParkingSessionHistoryDetail: builder.query({
      query: ({ sessionId }) => ({
        url: `/parking/parking-sessions/${sessionId}/details`,
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['ParkingSession'],
    }),
  }),
})

export const {
  useCheckInMutation,
  useCalculateCheckoutFeeMutation,
  useConfirmCheckoutMutation,
  useCheckSessionStatusQuery,
  useLazyCheckSessionStatusQuery, // Dùng cái này khi muốn gọi query thủ công (trigger)
  useGetMyParkingHistoryQuery,
  useGetParkingLotHistoryQuery,
  useGetSessionDetailsQuery,
  useGetActivePricingPoliciesQuery,
  useGetParkingSessionHistoryQuery,
  useGetParkingSessionHistoryDetailQuery,
} = parkingLotSessionAPI
