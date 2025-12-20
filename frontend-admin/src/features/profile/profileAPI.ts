import { apiSlice } from '../../apis/apiSlice'

export const profileAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    updateAdminProfile: builder.mutation({
      query: (adminProfileData) => ({
        url: '/core/admins',
        method: 'PUT',
        body: adminProfileData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['profile'],
    }),
    updateOperatorProfile: builder.mutation({
      query: (operatorProfileData) => ({
        url: '/core/operators',
        method: 'PUT',
        body: operatorProfileData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['profile'],
    }),
  }),
})

export const { useUpdateAdminProfileMutation, useUpdateOperatorProfileMutation } = profileAPI
