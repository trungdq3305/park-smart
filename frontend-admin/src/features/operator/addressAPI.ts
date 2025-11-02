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
  }),
})

export const { useCreateAddressMutation } = addressAPI
