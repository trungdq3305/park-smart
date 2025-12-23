import { apiSlice } from '../../apis/apiSlice'

export const parkingLotAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createParkingLot: builder.mutation({
      query: (parkingLotData) => ({
        url: '/parking/parking-lots/create-parking-lot-request',
        method: 'POST',
        body: parkingLotData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['parkingLot'],
    }),
    updateParkingLotRequest: builder.mutation({
      query: ({ parkingLotId, updateRequestDto }) => ({
        url: `/parking/parking-lots/send-update-requests/${parkingLotId}`,
        method: 'POST',
        body: updateRequestDto,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['parkingLot'],
    }),
    getParkingLotsOperator: builder.query({
      query: () => ({
        url: '/parking/parking-lots/find-for-operator',
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['parkingLot'],
    }),
    updateBookingSlotDurationHours: builder.mutation({
      query: ({ id, bookingSlotDurationHours }) => ({
        url: `/parking/parking-lots/update-booking-slot-duration/${id}`,
        method: 'PATCH',
        body: { bookingSlotDurationHours },
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['parkingLot'],
    }),
  }),
})

export const {
  useCreateParkingLotMutation,
  useGetParkingLotsOperatorQuery,
  useUpdateParkingLotRequestMutation,
  useUpdateBookingSlotDurationHoursMutation,
} = parkingLotAPI
