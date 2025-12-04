import type { Event } from '../../types/Event'
import type { EventStatus } from './eventTypes'

export const getEventStatus = (event: Event, now: Date): EventStatus => {
  const start = new Date(event.startDate)
  const end = new Date(event.endDate)

  if (now >= start && now <= end) return 'running'
  if (now < start) return 'upcoming'
  return 'ended'
}

export const formatDateRange = (start: string, end: string) => {
  const startDate = new Date(start)
  const endDate = new Date(end)

  const sameDay = startDate.toDateString() === endDate.toDateString()

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }

  if (sameDay) {
    return startDate.toLocaleDateString('vi-VN', options)
  }

  return `${startDate.toLocaleDateString('vi-VN', options)} - ${endDate.toLocaleDateString('vi-VN', options)}`
}


