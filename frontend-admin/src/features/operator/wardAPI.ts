import { apiSlice } from '../../apis/apiSlice'

export const wardAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWard: builder.query({
      query: () => ({
        url: '/parking/wards',
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['ward'],
    }),
  }),
})

export const { useGetWardQuery } = wardAPI
