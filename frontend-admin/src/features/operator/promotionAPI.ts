import { apiSlice } from '../../apis/apiSlice'

export const promotionAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createPromotion: builder.mutation({
      query: (promotion) => ({
        url: '/core/promotions',
        method: 'POST',
        body: promotion,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['promotion'],
    }),
    updatePromotion: builder.mutation({
      query: (promotion) => ({
        url: '/core/promotions',
        method: 'PUT',
        body: promotion,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['promotion'],
    }),
    deletePromotion: builder.mutation({
      query: (id) => ({
        url: `/core/promotions/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['promotion'],
    }),
    getPromotionsOperator: builder.query({
      query: ({ operatorId }) => ({
        url: '/core/promotions/operator',
        method: 'GET',
        params: { operatorId },
      }),
      transformResponse: (res) => res,
      providesTags: ['promotion'],
    }),
  }),
})

export const {
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
  useGetPromotionsOperatorQuery,
} = promotionAPI
