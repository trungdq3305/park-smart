import { apiSlice } from "../apis/apiSlice"

export const accountAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAccount: builder.query({
      query: () => ({
        url: '/core/accounts',
        method: 'GET',
      }),
      transformResponse: (res) => res,
        providesTags: ['account'],
    }),
  }),
})
export const { useGetAccountQuery } = accountAPI
