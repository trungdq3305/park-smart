import { apiSlice } from '../../apis/apiSlice'

export const subscriptionAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDefaultPlan: builder.query({
      query: () => ({
        url: '/core/subscriptionplans',
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['subscription'],
    }),
    updateDefaultPlan: builder.mutation({
      query: (planData) => ({
        url: '/core/subscriptionplans',
        method: 'PUT',
        body: planData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['subscription'],
    }),
  }),
})

export const {
  useGetDefaultPlanQuery,
  useUpdateDefaultPlanMutation,
} = subscriptionAPI
