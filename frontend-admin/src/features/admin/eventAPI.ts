import { apiSlice } from '../../apis/apiSlice'

export const eventAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query({
      query: () => ({
        url: '/core/events',
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['events'],
    }),
    createEvent: builder.mutation({
      query: (reportData) => ({
        url: '/core/events',
        method: 'POST',
        body: reportData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['events'],
    }),
  }),
})

export const { useGetReportsQuery, useCreateEventMutation } = eventAPI
