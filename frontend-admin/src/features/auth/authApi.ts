import { apiSlice } from '../../apis/apiSlice'
import { login } from './authSlice'

export const authAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      { data: { accessToken: string }[] }, // Cập nhật kiểu phản hồi
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login', // Đúng với baseUrl có /api/v1
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(login({ token: data.data[0].accessToken })) // Lấy token từ data.data[0].accessToken
        } catch (error) {
          console.log(error)
        }
      },
    }),
    register: builder.mutation({
      query: (userData: { name: string; email: string; password: string }) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
  }),
})

export const { useLoginMutation, useRegisterMutation } = authAPI
