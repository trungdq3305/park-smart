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
      query: ({ parkingLotOperatorId, status, type }) => ({
        url: `/parking/parking-lots/requests-by-operator/${parkingLotOperatorId}`,
        method: 'GET',
        params: { status, type },
      }),
      transformResponse: (res) => res,
      providesTags: ['parkingLot'],
    }),
    reviewParkingLotRequest: builder.mutation({
      query: ({ requestId, status, rejectionReason }) => ({
        url: `/parking/parking-lots/requests/${requestId}/review`,
        method: 'PATCH',
        body: { status, rejectionReason },
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['parkingLot', 'parkingLotRequest'],
    }),
    parkingLotRequests: builder.query({
      query: ({ status, type, page, pageSize }) => ({
        url: '/parking/parking-lots/all-requests',
        method: 'GET',
        params: { status, type, page, pageSize },
      }),
      transformResponse: (res) => res,
      providesTags: ['parkingLotRequest'],
    }),
    parkingLotRequestDetail: builder.query({
      query: ({ id }) => ({
        url: `/parking/parking-lots/requests/${id}`,
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['parkingLotRequest'],
    }),
    getParkingLotRequestOfOperator: builder.query({
      query: ({ parkingLotId }) => ({
        url: `/parking/parking-lots/${parkingLotId}/requests`,
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['parkingLotRequest'],
    }),
    createParkingLotRequest: builder.mutation({
      query: ({ payload }) => ({
        url: `/parking/parking-lots/create-parking-lot-request`,
        method: 'POST',
        body: payload,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['parkingLotRequest'],
    }),
  }),
})

export const {
  useGetParkingLotsAdminQuery,
  useParkingLotDetailsQuery,
  useReviewParkingLotRequestMutation,
  useParkingLotRequestsQuery,
  useParkingLotRequestDetailQuery,
  useGetParkingLotRequestOfOperatorQuery,
  useCreateParkingLotRequestMutation,
} = parkingLotAPI
