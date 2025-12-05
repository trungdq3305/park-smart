import React from 'react'
import type { GuestCardFilter } from './guestCardTypes'
import '../../pages/operator/manage-guest-card/ManageGuestCard.css'

interface GuestCardFiltersProps {
  searchNfcUid: string
  onSearchChange: (value: string) => void
  onSearchClear: () => void
  isSearching: boolean
  filter: GuestCardFilter
  onFilterChange: (filter: GuestCardFilter) => void
  filteredCount: number
  totalCount?: number
  searchResultCount?: number | null
  isSearchMode: boolean
}

export const GuestCardFilters: React.FC<GuestCardFiltersProps> = ({
  searchNfcUid,
  onSearchChange,
  onSearchClear,
  isSearching,
  filter,
  onFilterChange,
  filteredCount,
  totalCount,
  searchResultCount,
  isSearchMode,
}) => {
  return (
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
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onSearchClear()
              }
            }}
          />
          {searchNfcUid && (
            <button
              type="button"
              className="guest-card-search-clear"
              onClick={onSearchClear}
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
          {isSearching && <div className="guest-card-search-loading">🔍</div>}
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
          onChange={(e) => onFilterChange(e.target.value as GuestCardFilter)}
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
        {isSearchMode ? (
          <>
            {isSearching ? (
              <span>Đang tìm kiếm...</span>
            ) : searchResultCount !== null && searchResultCount !== undefined ? (
              <span>
                Tìm thấy <strong>{searchResultCount}</strong> thẻ
              </span>
            ) : (
              <span>Không tìm thấy thẻ</span>
            )}
          </>
        ) : (
          <>
            Đang hiển thị <strong>{filteredCount}</strong>
            {totalCount !== undefined && ` / ${totalCount}`} thẻ
          </>
        )}
      </div>
    </div>
  )
}

export default GuestCardFilters

