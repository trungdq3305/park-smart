import { apiSlice } from '../../apis/apiSlice'

export const dashboardAdminAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardAdmin: builder.query({
      query: () => ({
        url: '/core/dashboards/account-stats',
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['dashboardAdmin'],
    }),
    getDashboardNewRegistration: builder.query({
      query: ({startDate, endDate}) => ({
        url: '/core/dashboards/new-registrations',
        method: 'GET',
        params: {
          startDate,
          endDate,
        },
      }),
      transformResponse: (res) => res,
      providesTags: ['dashboardAdmin'],
    }),
  }),
})

export const { useGetDashboardAdminQuery, useGetDashboardNewRegistrationQuery } = dashboardAdminAPI
