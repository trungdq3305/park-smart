import React, { useMemo, useState, useEffect } from 'react'
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

interface GuestCardsResponse {
  data: GuestCard[]
  pagination: Pagination
}

type GuestCardFilter = 'all' | 'ACTIVE' | 'INACTIVE' | 'LOST' | 'DAMAGED' | 'LOCKED'

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    ACTIVE: 'Đang hoạt động',
    INACTIVE: 'Không hoạt động',
    LOST: 'Bị mất',
    DAMAGED: 'Bị hỏng',
    LOCKED: 'Đã khóa',
  }
  return statusMap[status] || status
}

const getStatusClass = (status: string) => {
  if (status === 'ACTIVE') return 'guest-card-status-active'
  if (status === 'INACTIVE') return 'guest-card-status-inactive'
  if (status === 'LOST') return 'guest-card-status-lost'
  if (status === 'DAMAGED') return 'guest-card-status-damaged'
  if (status === 'LOCKED') return 'guest-card-status-locked'
  return 'guest-card-status-pending'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ManageGuestCard: React.FC = () => {
  const [filter, setFilter] = useState<GuestCardFilter>('all')
  const [searchNfcUid, setSearchNfcUid] = useState<string>('')
  const [debouncedSearchNfcUid, setDebouncedSearchNfcUid] = useState<string>('')
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
  const { data, isLoading, error, refetch } = useGetGuestCardsQuery({
    parkingLotId,
    page: 1,
    pageSize: 10,
    status: filter !== 'all' ? filter : undefined,
  }) as {
    data?: GuestCardsResponse
    isLoading: boolean
    error?: unknown
    refetch: () => void
  }
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

  const guestCards: GuestCard[] = data?.data || []
  const searchedCard: GuestCard | null = searchResult?.data[0] || null

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
      
      // Refetch data to update UI
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
      
      // Refetch data to update UI
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

  if (isLoading) {
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
        <div className="guest-card-stats-section">
          <div className="guest-card-stat-card">
            <div className="guest-card-stat-icon active">✅</div>
            <div className="guest-card-stat-content">
              <h3>{stats.active}</h3>
              <p>Đang hoạt động</p>
              <div className="guest-card-stat-sub">Thẻ đang được sử dụng</div>
            </div>
          </div>
          <div className="guest-card-stat-card">
            <div className="guest-card-stat-icon inactive">⏸️</div>
            <div className="guest-card-stat-content">
              <h3>{stats.inactive}</h3>
              <p>Không hoạt động</p>
              <div className="guest-card-stat-sub">Thẻ đã bị vô hiệu hóa</div>
            </div>
          </div>
          <div className="guest-card-stat-card">
            <div className="guest-card-stat-icon lost">🔍</div>
            <div className="guest-card-stat-content">
              <h3>{stats.lost}</h3>
              <p>Bị mất</p>
              <div className="guest-card-stat-sub">Thẻ đã bị mất</div>
            </div>
          </div>
          <div className="guest-card-stat-card">
            <div className="guest-card-stat-icon damaged">⚠️</div>
            <div className="guest-card-stat-content">
              <h3>{stats.damaged}</h3>
              <p>Bị hỏng</p>
              <div className="guest-card-stat-sub">Thẻ đã bị hỏng</div>
            </div>
          </div>
          <div className="guest-card-stat-card">
            <div className="guest-card-stat-icon locked">🔒</div>
            <div className="guest-card-stat-content">
              <h3>{stats.locked}</h3>
              <p>Đã khóa</p>
              <div className="guest-card-stat-sub">Thẻ đã bị khóa</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="guest-card-controls-card">
          <div className="guest-card-search-wrapper">
            <label htmlFor="nfc-search" className="guest-card-search-label">
              Tìm kiếm theo NFC UID:
            </label>
            <div className="guest-card-search-input-wrapper">
              <input
                id="nfc-search"
                type="text"
                className="guest-card-search-input"
                placeholder="Nhập NFC UID để tìm kiếm..."
                value={searchNfcUid}
                onChange={(e) => setSearchNfcUid(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchNfcUid('')
                    setDebouncedSearchNfcUid('')
                  }
                }}
              />
              {searchNfcUid && (
                <button
                  type="button"
                  className="guest-card-search-clear"
                  onClick={() => {
                    setSearchNfcUid('')
                    setDebouncedSearchNfcUid('')
                  }}
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
              {isSearching && (
                <div className="guest-card-search-loading">🔍</div>
              )}
            </div>
          </div>
          <div className="guest-card-filter-wrapper">
            <label htmlFor="status-filter" className="guest-card-filter-label">
              Lọc theo trạng thái:
            </label>
            <select
              id="status-filter"
              className="guest-card-filter-select"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as GuestCardFilter)
                setSearchNfcUid('') // Clear search when changing filter
                setDebouncedSearchNfcUid('')
              }}
              disabled={!!searchNfcUid}
            >
              <option value="all">--</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="LOST">LOST</option>
              <option value="DAMAGED">DAMAGED</option>
              <option value="LOCKED">LOCKED</option>
            </select>
          </div>
          <div className="guest-card-counter">
            {debouncedSearchNfcUid ? (
              <>
                {isSearching ? (
                  <span>Đang tìm kiếm...</span>
                ) : searchedCard ? (
                  <span>
                    Tìm thấy <strong>1</strong> thẻ
                  </span>
                ) : (
                  <span>Không tìm thấy thẻ</span>
                )}
              </>
            ) : (
              <>
                Đang hiển thị <strong>{filteredCards.length}</strong> / {guestCards.length} thẻ
              </>
            )}
          </div>
        </div>

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
          <div className="guest-card-empty-state">
            <div className="guest-card-empty-icon">💳</div>
            <h3 className="guest-card-empty-title">
              {debouncedSearchNfcUid ? 'Không tìm thấy thẻ' : 'Chưa có thẻ khách nào'}
            </h3>
            <p className="guest-card-empty-text">
              {debouncedSearchNfcUid
                ? `Không tìm thấy thẻ với NFC UID: ${debouncedSearchNfcUid}. Vui lòng kiểm tra lại.`
                : 'Tạo mới thẻ khách để quản lý và theo dõi các thẻ NFC trong hệ thống Park Smart.'}
            </p>
          </div>
        ) : (
          <div className="guest-card-grid">
            {filteredCards.map((card, index) => {
              const statusClass = getStatusClass(card.status)
              const statusLabel = getStatusLabel(card.status)

              // Generate gradient colors based on index for visual variety
              const gradients = [
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
              ]
              const cardGradient = gradients[index % gradients.length]

              return (
                <article key={card._id} className="guest-card-item">
                  <div className="guest-card-header" style={{ background: cardGradient }}>
                    <div className="guest-card-chip">
                      <div className="guest-card-chip-line" />
                      <div className="guest-card-chip-line" />
                      <div className="guest-card-chip-line" />
                    </div>
                    <div className={`guest-card-status-badge ${statusClass}`}>
                      <span className="guest-card-status-dot" />
                      <span>{statusLabel}</span>
                    </div>
                  </div>

                  <div className="guest-card-body">
                    <div className="guest-card-code-section">
                      <div className="guest-card-code-label">Mã thẻ</div>
                      <div className="guest-card-code-value">{card.code || 'N/A'}</div>
                    </div>

                    <div className="guest-card-details">
                      <div className="guest-card-detail-item">
                        <div className="guest-card-detail-icon">📡</div>
                        <div className="guest-card-detail-content">
                          <span className="guest-card-detail-label">NFC UID</span>
                          <span className="guest-card-detail-value">
                            {card.nfcUid || 'Chưa có'}
                          </span>
                        </div>
                      </div>

                      <div className="guest-card-detail-item">
                        <div className="guest-card-detail-icon">🆔</div>
                        <div className="guest-card-detail-content">
                          <span className="guest-card-detail-label">ID thẻ</span>
                          <span className="guest-card-detail-value">{card._id}...</span>
                        </div>
                      </div>

                      <div className="guest-card-detail-item">
                        <div className="guest-card-detail-icon">🏢</div>
                        <div className="guest-card-detail-content">
                          <span className="guest-card-detail-label">Bãi đỗ xe</span>
                          <span className="guest-card-detail-value">
                            {card.parkingLotId || 'N/A'}...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="guest-card-footer">
                    <div className="guest-card-date-info">
                      <div className="guest-card-date-item">
                        <span className="guest-card-date-label">Tạo lúc:</span>
                        <span className="guest-card-date-value">{formatDate(card.createdAt)}</span>
                      </div>
                      <div className="guest-card-date-item">
                        <span className="guest-card-date-label">Cập nhật:</span>
                        <span className="guest-card-date-value">{formatDate(card.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="guest-card-actions">
                      <button
                        type="button"
                        className="guest-card-action-btn toggle"
                        onClick={() => handleStatusToggle(card)}
                        title={card.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      >
                        {card.status === 'ACTIVE' ? '⏸️' : '▶️'}
                      </button>
                      <button
                        type="button"
                        className="guest-card-action-btn delete"
                        onClick={() => handleDelete(card)}
                        title="Xóa thẻ"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageGuestCard

