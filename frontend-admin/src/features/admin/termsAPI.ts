import { apiSlice } from '../../apis/apiSlice'

export const termsAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTermsPolicies: builder.query({
      query: () => ({
        url: '/core/termpolicies',
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['terms-policies'],
    }),
    createTermsPolicy: builder.mutation({
        query: (termsPolicyData) => ({
          url: '/core/termpolicies',
          method: 'POST',
          body: termsPolicyData,
        }),
        transformResponse: (res) => res,
        invalidatesTags: ['terms-policies'],
      }),
    updateTermsPolicy: builder.mutation({
      query: (termsPolicyData) => ({
        url: '/core/termpolicies',
        method: 'PUT',
        body: termsPolicyData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['terms-policies'],
    }),
    deleteTermsPolicy: builder.mutation({
      query: (id: string) => ({
        url: `/core/termpolicies/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['terms-policies'],
    }),
  }),
})

export const { useGetTermsPoliciesQuery, useCreateTermsPolicyMutation, useUpdateTermsPolicyMutation, useDeleteTermsPolicyMutation } = termsAPI
