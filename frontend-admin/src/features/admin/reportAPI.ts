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
} = reportAPI
