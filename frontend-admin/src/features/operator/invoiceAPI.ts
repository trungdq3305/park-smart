import { apiSlice } from '../../apis/apiSlice'

export const invoiceAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createInvoice: builder.mutation({
      query: (invoiceData) => ({
        url: '/parking/invoices',
        method: 'POST',
        body: invoiceData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['invoice'],
    }),
    getInvoices: builder.query({
      query: () => ({
        url: '/core/payments/createdBy/me',
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['invoice'],
    }),
    confirmPayment: builder.query({
      query: ({ paymentId }: { paymentId: string }) => ({
        url: `/core/payments/confirm`,
        method: 'GET',
        params: { paymentId },
      }),
      transformResponse: (res) => res,
      providesTags: ['invoice'],
    }),
  }),
})

export const { useCreateInvoiceMutation, useGetInvoicesQuery, useConfirmPaymentQuery } = invoiceAPI
