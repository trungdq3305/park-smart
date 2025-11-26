import { apiSlice } from '../../apis/apiSlice'

export const parkingLotAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getParkingLotsAdmin: builder.query({
      query: ({ status, page, pageSize }) => ({
        url: '/parking/parking-lots',
        method: 'GET',
        params: { status, page, pageSize },
      }),
      transformResponse: (res) => res,
      providesTags: ['parkingLot'],
    }),
  }),
})

export const { useGetParkingLotsAdminQuery } = parkingLotAPI
