import { apiSlice } from '../../apis/apiSlice'

export const reportCategoryAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReportCategories: builder.query({
      query: () => ({
        url: '/core/reportcategories',
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['report-categories'],
    }),
  }),
})

export const { useGetReportCategoriesQuery } = reportCategoryAPI
