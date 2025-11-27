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
    parkingLotDetails: builder.query({
      query: ({parkingLotOperatorId,status,type}) => ({
        url: `/parking/parking-lots/requests-by-operator/${parkingLotOperatorId}`,
        method: 'GET',
        params: { status, type },
      }),
      transformResponse: (res) => res,
      providesTags: ['parkingLot'],
    }),
  }),
})

export const { useGetParkingLotsAdminQuery, useParkingLotDetailsQuery } = parkingLotAPI
