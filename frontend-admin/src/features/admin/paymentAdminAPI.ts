import { apiSlice } from '../../apis/apiSlice'

export const paymentAdminAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query({
      query: ({ params }) => ({
        url: '/core/dashboards/admin/payments',
        method: 'GET',
        params,
      }),
      transformResponse: (res) => res,
      providesTags: ['invoice'],
    }),
  }),
})

export const { useGetPaymentsQuery } = paymentAdminAPI
