import { apiSlice } from '../../apis/apiSlice'

export const basisAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBasis: builder.query({
      query: () => ({
        url: '/parking/basis',
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['basis'],
    }),
  }),
})

export const { useGetBasisQuery } = basisAPI
