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
    getEventsByOperatorId: builder.query({
      query: (id: string) => ({
        url: `/core/events/created-by?id=${id}`,
        method: 'GET',
      }),
      transformResponse: (res) => res,
      providesTags: ['events'],
    }),
  }),
})

export const { useGetEventsQuery, useCreateEventMutation, useGetEventsByOperatorIdQuery } = eventAPI
