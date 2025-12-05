import { apiSlice } from '../../apis/apiSlice'

export const guestCardAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    updateGuestCardStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/parking/guest-cards/${id}/status`,
        method: 'PATCH',
        params: { status },
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['guestCard'],
    }),
    getGuestCardById: builder.query({
      query: ({ id }) => ({
        url: `/parking/guest-cards/${id}`,
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['guestCard'],
    }),
    deleteGuestCard: builder.mutation({
      query: ({ id }) => ({
        url: `/parking/guest-cards/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['guestCard'],
    }),
    updateGuestCard: builder.mutation({
      query: ({ id, data }) => ({
        url: `/parking/guest-cards/${id}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['guestCard'],
    }),
    getGuestCards: builder.query({
      query: ({ parkingLotId, page, pageSize, status }) => ({
        url: `/parking/guest-cards`,
        method: 'GET',
        params: { parkingLotId, page, pageSize, status },
      }),
      transformResponse: (res) => res,
    }),
    guestCardNfcLookup: builder.query({
      query: ({ nfcUid, parkingLotId }) => ({
        url: `/parking/guest-cards/nfc-lookup`,
        method: 'GET',
        params: { nfcUid, parkingLotId },
      }),
      transformResponse: (res) => res,
    }),
  }),
})

export const {
  useUpdateGuestCardStatusMutation,
  useGetGuestCardByIdQuery,
  useDeleteGuestCardMutation,
  useUpdateGuestCardMutation,
  useGetGuestCardsQuery,
} = guestCardAPI
