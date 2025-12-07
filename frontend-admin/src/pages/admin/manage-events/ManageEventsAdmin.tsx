import React, { useMemo, useState } from 'react'
import { useGetEventsQuery } from '../../../features/admin/eventAPI'
import type { Event } from '../../../types/Event'
import './ManageEventsAdmin.css'
import { EventsStats } from '../../../components/events/EventsStats'
import { EventsFilters } from '../../../components/events/EventsFilters'
import { EventsGrid } from '../../../components/events/EventsGrid'
import { getEventStatus } from '../../../components/events/eventUtils'
import type { EventFilter } from '../../../components/events/eventTypes'

interface EventsResponse {
  data: Event[]
}

const ManageEventsAdmin: React.FC = () => {
  const { data, isLoading, error } = useGetEventsQuery({}) as {
    data?: EventsResponse
    isLoading: boolean
    error?: unknown
  }
  const [filter, setFilter] = useState<EventFilter>('all')

  const eventsData: Event[] = data?.data || []

  const now = useMemo(() => new Date(), [])

  const { running, upcoming, ended, withPromo } = useMemo(() => {
    let runningCount = 0
    let upcomingCount = 0
    let endedCount = 0
    let promoCount = 0

    eventsData.forEach((event) => {
      const status = getEventStatus(event, now)
      if (status === 'running') runningCount += 1
      if (status === 'upcoming') upcomingCount += 1
      if (status === 'ended') endedCount += 1
      if (event.includedPromotions) promoCount += 1
    })

    return {
      running: runningCount,
      upcoming: upcomingCount,
      ended: endedCount,
      withPromo: promoCount,
    }
  }, [eventsData, now])

  const filteredEvents = useMemo(() => {
    if (filter === 'promo') {
      return eventsData.filter((e) => e.includedPromotions)
    }

    if (filter === 'all') return eventsData

    return eventsData.filter((event) => getEventStatus(event, now) === filter)
  }, [eventsData, filter, now])

  if (isLoading) {
    return (
      <div className="manage-events-page">
        <div className="events-loading">
          <div className="events-loading-spinner" />
          <p>Đang tải danh sách sự kiện...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="manage-events-page">
        <div className="events-error">
          <span className="events-error-badge">Lỗi tải dữ liệu</span>
          <p>Không thể tải danh sách sự kiện. Vui lòng thử lại sau.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="manage-events-page">
      <div className="events-page-header">
        <h1>Quản lý sự kiện</h1>
        <p>Danh sách các chương trình, ưu đãi và sự kiện nổi bật trong hệ thống Park Smart</p>
      </div>

      <div className="events-page-content">
        <EventsStats
          total={eventsData.length}
          running={running}
          upcoming={upcoming}
          withPromo={withPromo}
        />

        <EventsFilters
          filter={filter}
          onChange={setFilter}
          total={eventsData.length}
          running={running}
          upcoming={upcoming}
          ended={ended}
          withPromo={withPromo}
          filteredCount={filteredEvents.length}
        />

        <EventsGrid events={filteredEvents} />
      </div>
    </div>
  )
}

export default ManageEventsAdmin
