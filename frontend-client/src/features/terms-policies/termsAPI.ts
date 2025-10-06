import { apiSlice } from '../../apis/apiSlice'

export const termsPoliciesAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTermsPolicies: builder.query({
      query: () => ({
        url: '/core/termpolicies',
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['terms-policies'],
    }),
  }),
})
export const { useGetTermsPoliciesQuery } = termsPoliciesAPI
