import { apiSlice } from '../../apis/apiSlice'
import type { DashboardResponse } from '../../types/Dashboard'

export interface DashboardFilters {
  parkingLotId: string
  timeRange: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
  targetDate: string
}

export const dashboardAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardAdmin: builder.query<DashboardResponse, DashboardFilters>({
      query: ({ parkingLotId, timeRange, targetDate }) => ({
        url: '/parking/dashboard',
        method: 'GET',
        params: {
          parkingLotId,
          timeRange,
          targetDate,
        },
      }),
      providesTags: ['dashboard'],
    }),
  }),
})

export const { useGetDashboardAdminQuery } = dashboardAPI
