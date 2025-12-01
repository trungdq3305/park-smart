import { apiSlice } from '../../apis/apiSlice'

export const dashboardAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardAdmin: builder.query({
      query: ({parkingLotId,timeRange,targetDate}) => ({
        url: '/parking/dashboard',
        method: 'GET',
        params: {
          parkingLotId,
          timeRange,
          targetDate,
        },
      }),
      transformResponse: (res) => res,
      providesTags: ['dashboard'],
    }),
  }),
})

export const { useGetDashboardAdminQuery } = dashboardAPI
