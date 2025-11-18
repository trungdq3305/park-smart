import { apiSlice } from '../../apis/apiSlice'
import type { OperatorFullRegisterRequest } from '../../types/register.types';
import { login } from './authSlice'

export const authAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<{ data: string }, { email: string; password: string }>({
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
    register: builder.mutation<{ data: string }, OperatorFullRegisterRequest>({
      query: (payload) => ({
        url: '/core/auths/operator-register',
        method: 'POST',
        body: payload,
      }),
    }),
  }),
})

export const { useLoginMutation, useRegisterMutation } = authAPI
