import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { message, Dropdown, Button } from 'antd'
import type { MenuProps } from 'antd'
import {
  MoreOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { AccountDetailsModal, DeleteConfirmModal } from '../../../components/modals'
import { PaginationLoading } from '../../../components/common'
import {
  useGetAccountQuery,
  useDeleteAccountMutation,
  useGetInactiveAccountQuery,
  useBannedAccountListQuery,
} from '../../../features/admin/accountAPI'
import type { Account } from '../../../types/Account'
import './ManageAccountPage.css'

interface ListAccountResponse {
  data: {
    data: {
      pagedAccounts: {
        data: Account[]
        currentPage: number
        pageSize: number
        totalItems: number
      }
      totalAdmins: number
      totalDrivers: number
      totalOperators: number
      totalUsers: number
    }
  }
  isLoading: boolean
}

interface ListInactiveAccountResponse {
  data: {
    data: Account[]
    totalItems: number
    pageSize: number
    totalPages: number
    currentPage: number
  }
  success: boolean
  message: string
  isLoading: boolean
}

interface ListBannedAccountResponse {
  data: {
    data: Account[]
    totalItems: number
    pageSize: number
    totalPages: number
    currentPage: number
  }
  isLoading: boolean
}

const translateRoleName = (roleName: string) => {
  switch (roleName.toLowerCase()) {
    case 'admin':
      return 'Quản trị viên'
    case 'operator':
      return 'Chủ bãi xe'
    case 'driver':
      return 'Tài xế'
    case 'user':
      return 'Người dùng'
    default:
      return roleName
  }
}

const ManageAccountPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Get values from URL parameters with defaults
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = 5 // Fixed page size, not from URL

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [showInactiveAccounts, setShowInactiveAccounts] = useState(false)
  const [showBannedAccounts, setShowBannedAccounts] = useState(false)

  const { data, isLoading } = useGetAccountQuery<ListAccountResponse>({
    page: currentPage,
    pageSize,
  })

  const { data: inactiveAccountData, isLoading: isInactiveAccountLoading } =
    useGetInactiveAccountQuery({
      page: currentPage,
      pageSize,
    }) as { data: ListInactiveAccountResponse | undefined; isLoading: boolean }

  const { data: bannedAccountData, isLoading: isBannedAccountLoading } = useBannedAccountListQuery({
    page: currentPage,
    pageSize,
  }) as { data: ListBannedAccountResponse | undefined; isLoading: boolean }

  const [deleteAccount] = useDeleteAccountMutation()

  const activeAccounts = data?.data?.pagedAccounts?.data || []
  const inActiveAccounts = inactiveAccountData?.data?.data || []
  const bannedAccounts = bannedAccountData?.data?.data || []

  // Determine which accounts to display based on toggle state
  const accounts = showBannedAccounts
    ? bannedAccounts
    : showInactiveAccounts
      ? inActiveAccounts
      : activeAccounts
  const totalItems = showBannedAccounts
    ? bannedAccountData?.data?.totalItems || 0
    : showInactiveAccounts
      ? inactiveAccountData?.data?.totalItems || 0
      : data?.data?.pagedAccounts?.totalItems || 0
  const totalPages = showBannedAccounts
    ? bannedAccountData?.data?.totalPages || 0
    : showInactiveAccounts
      ? inactiveAccountData?.data?.totalPages || 0
      : Math.ceil(totalItems / pageSize)

  const totalAdmins = data?.data?.totalAdmins || 0
  const totalOperators = data?.data?.totalOperators || 0
  const totalDrivers = data?.data?.totalDrivers || 0
  // Functions to update URL parameters
  const updateSearchParams = (updates: Record<string, string | number | null>) => {
    const newSearchParams = new URLSearchParams(searchParams)

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') {
        newSearchParams.delete(key)
      } else {
        newSearchParams.set(key, value.toString())
      }
    })

    setSearchParams(newSearchParams, { replace: true })
  }

  const handlePageChange = (page: number) => {
    setIsPageLoading(true)
    updateSearchParams({ page })

    // Reset loading state after a short delay to show the loading effect
    setTimeout(() => {
      setIsPageLoading(false)
    }, 500)
  }

  const handleViewDetails = (account: Account) => {
    setSelectedAccount(account)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedAccount(null)
  }

  const handleDeleteAccount = (account: Account) => {
    setAccountToDelete(account)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteAccount = async () => {
    if (accountToDelete) {
      try {
        await deleteAccount(accountToDelete._id).unwrap()
        setShowDeleteConfirm(false)
        setAccountToDelete(null)
        message.success(`Tài khoản ${accountToDelete.email} đã được xóa thành công!`)
      } catch (error) {
        console.error('Error deleting account:', error)
        message.error('Có lỗi xảy ra khi xóa tài khoản!')
      }
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 'badge-active' : 'badge-inactive'
  }

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'badge-admin'
      case 'operator':
        return 'badge-operator'
      case 'driver':
        return 'badge-driver'
      default:
        return 'badge-default'
    }
  }

  const getMenuItems = (account: Account): MenuProps['items'] => [
    {
      key: 'view',
      label: 'Xem hồ sơ',
      icon: <EyeOutlined />,
      onClick: () => handleViewDetails(account),
    },
    {
      key: 'delete',
      label: 'Xóa tài khoản',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDeleteAccount(account),
    },
  ]

  const handleToggleView = () => {
    setShowInactiveAccounts(!showInactiveAccounts)
    setShowBannedAccounts(false)
    // Reset to page 1 when switching views
    updateSearchParams({ page: 1 })
  }

  const handleToggleBannedView = () => {
    setShowBannedAccounts(!showBannedAccounts)
    setShowInactiveAccounts(false)
    // Reset to page 1 when switching views
    updateSearchParams({ page: 1 })
  }

  const isLoadingData = showBannedAccounts
    ? isBannedAccountLoading
    : showInactiveAccounts
      ? isInactiveAccountLoading
      : isLoading

  if (isLoadingData && !isPageLoading) {
    return (
      <div className="manage-account-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="manage-account-page">
      <div className="page-header">
        <h1>Quản lý tài khoản</h1>
        <p>Quản lý và theo dõi tất cả tài khoản trong hệ thống</p>
      </div>

      <div className="page-content">
        {/* Stats Cards */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon admin-icon">👤</div>
            <div className="stat-content">
              <h3>{totalAdmins}</h3>
              <p>Quản trị viên</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon operator-icon">🏢</div>
            <div className="stat-content">
              <h3>{totalOperators}</h3>
              <p>Chủ bãi xe</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon driver-icon">🚗</div>
            <div className="stat-content">
              <h3>{totalDrivers}</h3>
              <p>Tài xế</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon total-icon">📊</div>
            <div className="stat-content">
              <h3>{totalItems}</h3>
              <p>Tổng tài khoản</p>
            </div>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="table-container">
          <div className="table-header">
            <h3>Danh sách tài khoản</h3>
            <div className="table-controls">
              <button
                className={`filter-btn ${!showInactiveAccounts && !showBannedAccounts ? 'active' : ''}`}
                onClick={() => {
                  setShowInactiveAccounts(false)
                  setShowBannedAccounts(false)
                  updateSearchParams({ page: 1 })
                }}
              >
                Tài khoản hoạt động
              </button>
              <button
                className={`filter-btn ${showInactiveAccounts ? 'active' : ''}`}
                onClick={handleToggleView}
              >
                Tài khoản không hoạt động
              </button>
              <button
                className={`filter-btn ${showBannedAccounts ? 'active' : ''}`}
                onClick={handleToggleBannedView}
              >
                Tài khoản bị cấm
              </button>
              <span className="table-count">{accounts.length} tài khoản</span>
            </div>
          </div>

          <div className="table-wrapper">
            <PaginationLoading isLoading={isPageLoading} loadingText="Đang tải trang...">
              {accounts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <h3 className="empty-state-title">
                    {showBannedAccounts
                      ? 'Không có tài khoản bị cấm'
                      : showInactiveAccounts
                        ? 'Không có tài khoản không hoạt động'
                        : 'Không có tài khoản hoạt động'}
                  </h3>
                  <p className="empty-state-message">
                    {showBannedAccounts
                      ? 'Hiện tại không có tài khoản nào bị cấm trong hệ thống.'
                      : showInactiveAccounts
                        ? 'Hiện tại không có tài khoản nào không hoạt động trong hệ thống.'
                        : 'Hiện tại không có tài khoản nào đang hoạt động trong hệ thống.'}
                  </p>
                </div>
              ) : (
                <table className="accounts-table">
                  <thead>
                    <tr>
                      <th>Thông tin tài khoản</th>
                      <th>Vai trò</th>
                      <th>Trạng thái</th>
                      <th>Lần đăng nhập cuối</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account: Account) => (
                      <tr key={account._id}>
                        <td>
                          <div className="account-info">
                            <div className="account-avatar">
                              {account.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="account-details">
                              <h4>{account.email}</h4>
                              <p>{account.phoneNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge ${getRoleBadgeColor(account.roleName)}`}>
                            {translateRoleName(account.roleName)}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusBadge(account.isActive)}`}>
                            {account.isActive ? 'Hoạt động' : 'Không hoạt động'}
                          </span>
                        </td>
                        <td>
                          {account.lastLoginAt
                            ? new Date(account.lastLoginAt).toLocaleDateString('vi-VN')
                            : 'Chưa đăng nhập'}
                        </td>
                        <td>
                          <div className="action-cell">
                            <Dropdown
                              menu={{ items: getMenuItems(account) }}
                              trigger={['click']}
                              placement="bottomRight"
                            >
                              <Button
                                type="text"
                                icon={<MoreOutlined />}
                                className="action-dropdown-trigger"
                                title="Thao tác"
                              />
                            </Dropdown>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </PaginationLoading>
          </div>

          {/* Pagination */}
          {accounts.length > 0 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={currentPage === 1 || isPageLoading}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                {isPageLoading ? '...' : 'Trước'}
              </button>

              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`pagination-number ${currentPage === page ? 'active' : ''} ${isPageLoading ? 'loading' : ''}`}
                    onClick={() => handlePageChange(page)}
                    disabled={isPageLoading}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                className="pagination-btn"
                disabled={currentPage === totalPages || isPageLoading}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                {isPageLoading ? '...' : 'Sau'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account Details Modal */}
      <AccountDetailsModal open={showModal} onClose={handleCloseModal} account={selectedAccount} />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteAccount}
        account={accountToDelete}
      />
    </div>
  )
}

export default ManageAccountPage
