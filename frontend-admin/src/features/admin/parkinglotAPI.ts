import { apiSlice } from '../../apis/apiSlice'

export const parkingLotAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getParkingLotsAdmin: builder.query({
      query: ({ parkingLotStatusId, page, pageSize }) => ({
        url: '/parking/parking-lots',
        method: 'GET',
        params: { parkingLotStatusId, page, pageSize },
      }),
      transformResponse: (res) => res,
      providesTags: ['parkingLots'],
    }),
  }),
})

export const {
  useGetParkingLotsAdminQuery,
} = parkingLotAPI
