import { apiSlice } from '../../apis/apiSlice'

export const reportAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query({
      query: () => ({
        url: '/core/reports',
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['reports'],
    }),
    createReport: builder.mutation({
      query: (reportData) => ({
        url: '/core/reports',
        method: 'POST',
        body: reportData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['reports'],
    }),
    getMyReports: builder.query({
      query: () => ({
        url: '/core/reports/my-reports',
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['reports'],
    }),
    handleReport: builder.mutation({
      query: (reportData) => ({
        url: '/core/reports/process',
        method: 'PUT',
        body: reportData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['reports'],
    }),
  }),
})

export const {
  useGetReportsQuery,
  useCreateReportMutation,
  useHandleReportMutation,
  useGetMyReportsQuery,
} = reportAPI
