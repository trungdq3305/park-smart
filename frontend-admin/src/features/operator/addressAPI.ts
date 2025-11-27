import { apiSlice } from '../../apis/apiSlice'

export const addressAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createAddress: builder.mutation({
      query: (addressData) => ({
        url: '/parking/addresses',
        method: 'POST',
        body: addressData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['address'],
    }),
    getAddressById: builder.query({
      query: ({id}) => ({
        url: `/parking/addresses/${id}`,
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['address'],
    }),
  }),
})

export const { useCreateAddressMutation, useGetAddressByIdQuery } = addressAPI
