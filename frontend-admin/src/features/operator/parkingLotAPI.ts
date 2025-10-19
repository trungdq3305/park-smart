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
  }),
})

export const {
  useCreateParkingLotMutation,
} = parkingLotAPI
