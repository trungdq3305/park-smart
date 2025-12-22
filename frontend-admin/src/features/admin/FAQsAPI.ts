import { apiSlice } from '../../apis/apiSlice'

export const FAQsAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFAQs: builder.query({
      query: ({ page, pageSize }) => ({
        url: '/core/faqs',
        method: 'GET',
        params: { page, pageSize },
      }),
      transformResponse: (res) => res,
      providesTags: ['faqs'],
    }),
    createFAQ: builder.mutation({
      query: (faqData) => ({
        url: '/core/faqs',
        method: 'POST',
        body: faqData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['faqs'],
    }),
    getMyFAQs: builder.query({
      query: ({ page, pageSize }) => ({
        url: '/core/faqs/me',
        method: 'GET',
        params: { page, pageSize },
      }),
      transformResponse: (res) => res,
      providesTags: ['faqs'],
    }),
    deleteFAQ: builder.mutation({
      query: (id) => ({
        url: `/core/faqs/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['faqs'],
    }),
    updateFAQ: builder.mutation({
      query: (faqData) => ({
        url: '/core/faqs',
        method: 'PUT',
        body: faqData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['faqs'],
    }),
    approveFAQ: builder.mutation({
      query: (id) => ({
        url: `/core/faqs/${id}/approve`,
        method: 'PUT',
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['faqs'],
    }),
    rejectFAQ: builder.mutation({
      query: ({ id, rejectReason }) => ({
        url: `/core/faqs/${id}/reject`,
        method: 'PUT',
        body: rejectReason,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['faqs'],
    }),
  }),
})

export const {
  useGetFAQsQuery,
  useCreateFAQMutation,
  useGetMyFAQsQuery,
  useDeleteFAQMutation,
  useUpdateFAQMutation,
  useApproveFAQMutation,
  useRejectFAQMutation,
} = FAQsAPI
