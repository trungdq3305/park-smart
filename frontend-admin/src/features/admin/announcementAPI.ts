import { apiSlice } from '../../apis/apiSlice'

export const announcementAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAnnouncements: builder.query({
      query: () => ({
        url: '/parking/admin/announcements',
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['announcements'],
    }),
    createAnnouncement: builder.mutation({
      query: (announcementData) => ({
        url: '/parking/admin/announcements',
        method: 'POST',
        body: announcementData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['announcements'],
    }),
    createAnnouncementNow: builder.mutation({
      query: (announcementData) => ({
        url: '/parking/admin/announcements/send-now',
        method: 'POST',
        body: announcementData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['announcements'],
    }),
  }),
})

export const {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useCreateAnnouncementNowMutation,
} = announcementAPI
