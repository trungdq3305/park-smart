import { apiSlice } from '../../apis/apiSlice'

export const commentAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createComment: builder.mutation({
      query: (commentData) => ({
        url: '/parking/comments',
        method: 'POST',
        body: commentData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['comment'],
    }),
    getCommentByParkingLot: builder.query({
      query: ({ parkingLotId ,page,pageSize }) => ({
        url: `/core/comments/by-parkinglot/${parkingLotId }`,
        method: 'GET',
        params: { page, pageSize },
      }),
      transformResponse: (res) => res,
      providesTags: ['comment'],
    }),
    replyComment: builder.mutation({
      query: (commentData) => ({
        url: '/core/comments/',
        method: 'POST',
        body: commentData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['comment'],
    }),
  }),
})

export const {
  useCreateCommentMutation,
  useGetCommentByParkingLotQuery,
  useReplyCommentMutation,
} = commentAPI
