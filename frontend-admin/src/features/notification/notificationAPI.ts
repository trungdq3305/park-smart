// src/apis/notificationAPI.ts

import { apiSlice } from '../../apis/apiSlice'

export const notificationAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Lấy danh sách thông báo
    getNotifications: builder.query<any, string>({
      // Thay 'any' bằng interface Notification[] nếu có
      query: (_userId) => ({
        url: `/parking/notifications`,
        method: 'GET',
      }),
      providesTags: ['Notification'],
      transformResponse: (res: any) => res, // Giữ nguyên phản hồi { data: [...] }
    }),

    // 2. Lấy số lượng thông báo chưa đọc
    getUnreadCount: builder.query<number, string>({
      query: (_userId) => ({
        url: `/parking/notifications/unread-count`,
        method: 'GET',
      }),
      providesTags: ['NotificationCount'],
      transformResponse: (res: any) => res.data[0], // Lấy count từ [count]
    }),

    // 3. Đánh dấu tất cả là đã đọc
    markAllAsRead: builder.mutation<number, string>({
      query: (_userId) => ({
        url: `/parking/notifications/read-all`,
        method: 'PATCH',
        body: { _userId },
      }),
      invalidatesTags: ['Notification', 'NotificationCount'],
      transformResponse: (res: any) => res.data[0],
    }),

    // 4. API Mẫu: Gửi thông báo (dùng cho nút Test)
    sendTestNotification: builder.mutation<any, any>({
      query: (payload) => ({
        url: '/parking/notifications',
        method: 'POST',
        body: payload,
      }),
      // Khi gửi thông báo, nó sẽ tự động kích hoạt refetch của các query trên
      invalidatesTags: ['Notification', 'NotificationCount'],
    }),
    markAsReadSingle: builder.mutation<any, string>({
      query: (notificationId) => ({
        url: `/parking/notifications/${notificationId}/read`,
        method: 'PATCH',
        // invalidatesTags sẽ chạy sau khi thành công
      }),
      // Khi đánh dấu một mục, chúng ta cần cập nhật cache của cả danh sách
      // và số lượng chưa đọc.
      async onQueryStarted(_notificationId, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled

          // Cập nhật lại số lượng chưa đọc và danh sách bằng cách vô hiệu hóa tags
          // Đây là cách tối ưu để RTK tự re-fetch:
          dispatch(apiSlice.util.invalidateTags(['Notification', 'NotificationCount']))
        } catch (error) {
          console.error('Failed to mark single notification as read:', error)
        }
      },
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllAsReadMutation,
  useSendTestNotificationMutation,
  useMarkAsReadSingleMutation,
} = notificationAPI
