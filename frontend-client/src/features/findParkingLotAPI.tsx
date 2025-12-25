import { apiSlice } from '../apis/apiSlice'

export const findParkingLotAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    findParkingLot: builder.query({
      query: ({ bottomLeftLng, bottomLeftLat, topRightLng, topRightLat, page, pageSize }) => ({
        url: '/parking/parking-lots/in-bounds',
        method: 'GET',
        params: { bottomLeftLng, bottomLeftLat, topRightLng, topRightLat, page, pageSize },
      }),
      transformResponse: (res) => res,
      providesTags: ['parkingLot'],
    }),
  }),
})
export const { useFindParkingLotQuery } = findParkingLotAPI
