import React from 'react'
import '../../pages/operator/manage-guest-card/ManageGuestCard.css'

interface GuestCardEmptyStateProps {
  searchNfcUid?: string
}

export const GuestCardEmptyState: React.FC<GuestCardEmptyStateProps> = ({ searchNfcUid }) => {
  return (
    <div className="guest-card-empty-state">
      <div className="guest-card-empty-icon">💳</div>
      <h3 className="guest-card-empty-title">
        {searchNfcUid ? 'Không tìm thấy thẻ' : 'Chưa có thẻ khách nào'}
      </h3>
      <p className="guest-card-empty-text">
        {searchNfcUid
          ? `Không tìm thấy thẻ với NFC UID: ${searchNfcUid}. Vui lòng kiểm tra lại.`
          : 'Tạo mới thẻ khách để quản lý và theo dõi các thẻ NFC trong hệ thống Park Smart.'}
      </p>
    </div>
  )
}

export default GuestCardEmptyState

