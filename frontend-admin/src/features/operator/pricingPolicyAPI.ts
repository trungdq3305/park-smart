import { apiSlice } from '../../apis/apiSlice'

export const pricingPolicyAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPricingPoliciesOperator: builder.query({
      query: ({ parkingLotId, page, pageSize, isDeleted }) => ({
        url: `/parking/parking-lot-links/by-parking-lot/${parkingLotId}`,
        method: 'GET',
        params: { page, pageSize, isDeleted },
      }),
      transformResponse: (res) => res,
      providesTags: ['pricingPolicy'],
    }),
  }),
})

export const { useGetPricingPoliciesOperatorQuery } = pricingPolicyAPI
