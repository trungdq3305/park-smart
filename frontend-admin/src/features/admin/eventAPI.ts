import { apiSlice } from '../../apis/apiSlice'

export const eventAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEvents: builder.query({
      query: () => ({
        url: '/core/events',
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['events'],
    }),
    createEvent: builder.mutation({
      query: (eventData) => ({
        url: '/core/events',
        method: 'POST',
        body: eventData,
      }),
      transformResponse: (res) => res,
      invalidatesTags: ['events'],
    }),
    getEventsByOperator: builder.query({
      query: () => ({
        url: '/core/events/me',
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['events'],
    }),
  }),
})

export const { useGetEventsQuery, useCreateEventMutation, useGetEventsByOperatorQuery } = eventAPI
