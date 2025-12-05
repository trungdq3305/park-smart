import React, { useMemo, useState, useEffect, useCallback } from 'react'
import {
  useGetGuestCardsQuery,
  useUpdateGuestCardStatusMutation,
  useDeleteGuestCardMutation,
  useGuestCardNfcLookupQuery,
} from '../../../features/operator/guestCardAPI'
import type { GuestCard } from '../../../types/guestCard'
import { message } from 'antd'
import './ManageGuestCard.css'
import { getParkingLotId } from '../../../utils/parkingLotId'
import type { Pagination } from '../../../types/Pagination'
import {
  GuestCardStats,
  GuestCardFilters,
  GuestCardGrid,
  GuestCardEmptyState,
  type GuestCardFilter,
} from '../../../components/guest-cards'

interface GuestCardsResponse {
  data: GuestCard[]
  pagination: Pagination
}

const ManageGuestCard: React.FC = () => {
  const [filter, setFilter] = useState<GuestCardFilter>('all')
  const [searchNfcUid, setSearchNfcUid] = useState<string>('')
  const [debouncedSearchNfcUid, setDebouncedSearchNfcUid] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [allGuestCards, setAllGuestCards] = useState<GuestCard[]>([])
  const parkingLotId = getParkingLotId()

  // Debounce search input to avoid calling API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchNfcUid(searchNfcUid)
    }, 500) // Wait 500ms after user stops typing

    return () => {
      clearTimeout(timer)
    }
  }, [searchNfcUid])

  // Reset page and cards when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
    setAllGuestCards([])
  }, [filter, debouncedSearchNfcUid])

  const { data, isLoading, error, refetch } = useGetGuestCardsQuery({
    parkingLotId,
    page: currentPage,
    pageSize: 10,
    status: filter !== 'all' ? filter : undefined,
  }) as {
    data?: GuestCardsResponse
    isLoading: boolean
    error?: unknown
    refetch: () => void
  }

  // Accumulate data when new page is loaded
  useEffect(() => {
    if (data?.data) {
      if (currentPage === 1) {
        // First page - replace all
        setAllGuestCards(data.data)
      } else {
        // Subsequent pages - append
        setAllGuestCards((prev) => [...prev, ...data.data])
      }
    }
  }, [data, currentPage])

  const [updateStatus] = useUpdateGuestCardStatusMutation()
  const [deleteCard] = useDeleteGuestCardMutation()

  // NFC Lookup query - only run when debouncedSearchNfcUid is provided
  const {
    data: searchResult,
    isLoading: isSearching,
    error: searchError,
  } = useGuestCardNfcLookupQuery(
    {
      nfcUid: debouncedSearchNfcUid,
      parkingLotId: parkingLotId || '',
    },
    {
      skip: !debouncedSearchNfcUid || debouncedSearchNfcUid.trim() === '' || !parkingLotId,
    }
  )

  const guestCards: GuestCard[] = allGuestCards
  const searchedCard: GuestCard | null = searchResult?.data[0] || null
  const pagination = data?.pagination
  const hasMorePages = pagination ? currentPage < pagination.totalPages : false

  const stats = useMemo(() => {
    const active = guestCards.filter((card) => card.status === 'ACTIVE').length
    const inactive = guestCards.filter((card) => card.status === 'INACTIVE').length
    const lost = guestCards.filter((card) => card.status === 'LOST').length
    const damaged = guestCards.filter((card) => card.status === 'DAMAGED').length
    const locked = guestCards.filter((card) => card.status === 'LOCKED').length

    return { active, inactive, lost, damaged, locked }
  }, [guestCards])

  const filteredCards = useMemo(() => {
    // If searching, show only the searched card
    if (debouncedSearchNfcUid && searchedCard) {
      return [searchedCard]
    }

    // Otherwise, apply filter
    if (filter === 'all') return guestCards
    return guestCards.filter((card) => card.status === filter)
  }, [guestCards, filter, debouncedSearchNfcUid, searchedCard])

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMorePages && !debouncedSearchNfcUid) {
      setCurrentPage((prev) => prev + 1)
    }
  }, [isLoading, hasMorePages, debouncedSearchNfcUid])

  const handleStatusToggle = async (card: GuestCard) => {
    try {
      const newStatus = card.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      const response = await updateStatus({
        id: card._id,
        status: newStatus,
      }).unwrap()

      const successMsg =
        (response as { message?: string })?.message ||
        `Đã ${newStatus === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu hóa'} thẻ ${card.code}`
      message.success(successMsg)

      // Reset to page 1 and refetch
      setCurrentPage(1)
      setAllGuestCards([])
      refetch()
    } catch (error: unknown) {
      const errorMsg =
        (error as { data?: { message?: string } })?.data?.message ||
        (error as { message?: string })?.message ||
        (error as { error?: string })?.error ||
        'Có lỗi xảy ra khi cập nhật trạng thái thẻ'
      message.error(errorMsg)
    }
  }

  const handleDelete = async (card: GuestCard) => {
    try {
      const response = await deleteCard({ id: card._id }).unwrap()

      const successMsg = (response as { message?: string })?.message || `Đã xóa thẻ ${card.code}`
      message.success(successMsg)

      // Reset to page 1 and refetch
      setCurrentPage(1)
      setAllGuestCards([])
      refetch()
    } catch (error: unknown) {
      const errorMsg =
        (error as { data?: { message?: string } })?.data?.message ||
        (error as { message?: string })?.message ||
        (error as { error?: string })?.error ||
        'Có lỗi xảy ra khi xóa thẻ'
      message.error(errorMsg)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchNfcUid(value)
  }

  const handleSearchClear = () => {
    setSearchNfcUid('')
    setDebouncedSearchNfcUid('')
  }

  const handleFilterChange = (newFilter: GuestCardFilter) => {
    setFilter(newFilter)
    setSearchNfcUid('')
    setDebouncedSearchNfcUid('')
  }

  if (isLoading && currentPage === 1) {
    return (
      <div className="manage-guest-card-page">
        <div className="guest-card-loading">
          <div className="guest-card-loading-spinner" />
          <p>Đang tải danh sách thẻ khách...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="manage-guest-card-page">
        <div className="guest-card-error">
          <span className="guest-card-error-badge">Lỗi tải dữ liệu</span>
          <p>Không thể tải danh sách thẻ khách. Vui lòng thử lại sau.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="manage-guest-card-page">
      <div className="guest-card-page-header">
        <h1>Quản lý thẻ khách</h1>
        <p>Quản lý và theo dõi tất cả thẻ NFC khách trong hệ thống Park Smart</p>
      </div>

      <div className="guest-card-page-content">
        {/* Stats */}
        <GuestCardStats stats={stats} />

        {/* Search and Filters */}
        <GuestCardFilters
          searchNfcUid={searchNfcUid}
          onSearchChange={handleSearchChange}
          onSearchClear={handleSearchClear}
          isSearching={isSearching}
          filter={filter}
          onFilterChange={handleFilterChange}
          filteredCount={filteredCards.length}
          totalCount={pagination?.totalItems}
          searchResultCount={searchedCard ? 1 : null}
          isSearchMode={!!debouncedSearchNfcUid}
        />

        {/* Search Error */}
        {debouncedSearchNfcUid && searchError && (
          <div className="guest-card-search-error">
            <span className="guest-card-error-badge">Lỗi tìm kiếm</span>
            <p>
              {(searchError as { data?: { message?: string } })?.data?.message ||
                (searchError as { message?: string })?.message ||
                'Không thể tìm kiếm thẻ. Vui lòng thử lại.'}
            </p>
          </div>
        )}

        {/* Guest Cards Grid */}
        {filteredCards.length === 0 ? (
          <GuestCardEmptyState searchNfcUid={debouncedSearchNfcUid || undefined} />
        ) : (
          <GuestCardGrid
            cards={filteredCards}
            hasMorePages={!debouncedSearchNfcUid && hasMorePages}
            isLoading={isLoading}
            onLoadMore={handleLoadMore}
            onStatusToggle={handleStatusToggle}
            onDelete={handleDelete}
            totalItems={pagination?.totalItems}
          />
        )}
      </div>
    </div>
  )
}

export default ManageGuestCard
