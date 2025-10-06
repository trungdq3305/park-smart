import { apiSlice } from '../../apis/apiSlice'

export const faqsAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFAQs: builder.query({
      query: () => ({
        url: '/core/faqs',
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['faqs'],
    }),
  }),
})
export const { useGetFAQsQuery } = faqsAPI
