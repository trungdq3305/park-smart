import { apiSlice } from '../../apis/apiSlice'

export const dashboardAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardAdmin: builder.query({
      query: ({ params }) => ({
        url: 'parking/dashboards',
        method: 'GET',
        params: params,
      }),
      transformResponse: (res) => res,
      providesTags: ['dashboard'],
    }),
  }),
})

export const { useGetDashboardAdminQuery } = dashboardAPI
