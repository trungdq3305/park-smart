import { apiSlice } from '../../apis/apiSlice'
import { login } from './authSlice'

export const authAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<{ data:string}, { email: string; password: string }>({
      query: (credentials) => ({
        url: '/core/auths/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(login({ token: data.data })) // Lấy token từ data.data[0].data
        } catch (error) {
          console.log(error)
        }
      },
    }),
    register: builder.mutation({
      query: (userData: { email: string; password: string, phoneNumber: string, fullName: string }) => ({
        url: '/core/auths/operator-register',
        method: 'POST',
        body: userData,
      }),
    }),
  }),
})

export const { useLoginMutation, useRegisterMutation } = authAPI
