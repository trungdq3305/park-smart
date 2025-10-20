import { apiSlice } from '../apis/apiSlice'

export const accountAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAccount: builder.query({
      query: ({ page, pageSize }) => ({
        url: '/core/accounts',
        method: 'GET',
        params: { page, pageSize },
      }),
      transformResponse: (res) => res,
      providesTags: ['account'],
    }),
    getAccountById: builder.query({
      query: (id: string) => ({
        url: `/core/accounts/${id}`,
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: (_result, _error, id) => [{ type: 'account', id }],
    }),
    updateAccount: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/core/accounts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['account'],
    }),
    deleteAccount: builder.mutation({
      query: (id: string) => ({
        url: `/core/accounts/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['account'],
    }),
    toggleAccountStatus: builder.mutation({
      query: ({ id, isActive }) => ({
        url: `/core/accounts/${id}/toggle-status`,
        method: 'PATCH',
        body: { isActive },
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['account'],
    }),
    createAccount: builder.mutation({
      query: (accountData) => ({
        url: '/core/accounts',
        method: 'POST',
        body: accountData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['account'],
    }),
  }),
})

export const {
  useGetAccountQuery,
  useGetAccountByIdQuery,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useToggleAccountStatusMutation,
  useCreateAccountMutation,
} = accountAPI
