import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { message, Dropdown, Button } from 'antd'
import type { MenuProps } from 'antd'
import {
  MoreOutlined,
  EyeOutlined,
  KeyOutlined,
  DeleteOutlined,
  PauseOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import { AccountDetailsModal, DeleteConfirmModal } from '../../components/modals'
import {
  useGetAccountQuery,
  useDeleteAccountMutation,
  useToggleAccountStatusMutation,
} from '../../features/accountAPI'
import type { Account } from '../../types/Account'
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

const ManageAccountPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Get values from URL parameters with defaults
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = 5 // Fixed page size, not from URL

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)

  const { data, isLoading } = useGetAccountQuery<ListAccountResponse>({
    page: currentPage,
    pageSize,
  })

  const [deleteAccount] = useDeleteAccountMutation()
  const [toggleAccountStatus] = useToggleAccountStatusMutation()

  const accounts = data?.data?.pagedAccounts?.data || []
  const totalItems = data?.data?.pagedAccounts?.totalItems || 0
  const totalPages = Math.ceil(totalItems / pageSize)
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
    updateSearchParams({ page })
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

  const handleToggleStatus = async (account: Account) => {
    try {
      await toggleAccountStatus({
        id: account._id,
        isActive: !account.isActive,
      }).unwrap()
      message.success(`Trạng thái tài khoản ${account.email} đã được cập nhật!`)
    } catch (error) {
      console.error('Error toggling account status:', error)
      message.error('Có lỗi xảy ra khi cập nhật trạng thái tài khoản!')
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
      label: 'Xem profile',
      icon: <EyeOutlined />,
      onClick: () => handleViewDetails(account),
    },
    {
      key: 'permission',
      label: 'Thay đổi quyền',
      icon: <KeyOutlined />,
      onClick: () => {
        message.info('Tính năng thay đổi quyền đang được phát triển')
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'toggle',
      label: account.isActive ? 'Vô hiệu hóa' : 'Kích hoạt',
      icon: account.isActive ? <PauseOutlined /> : <PlayCircleOutlined />,
      onClick: () => handleToggleStatus(account),
    },
    {
      key: 'delete',
      label: 'Xóa tài khoản',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDeleteAccount(account),
    },
  ]

  if (isLoading) {
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
              <p>Admin</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon operator-icon">🏢</div>
            <div className="stat-content">
              <h3>{totalOperators}</h3>
              <p>Operator</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon driver-icon">🚗</div>
            <div className="stat-content">
              <h3>{totalDrivers}</h3>
              <p>Driver</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon total-icon">📊</div>
            <div className="stat-content">
              <h3>{totalItems}</h3>
              <p>Tổng cộng</p>
            </div>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="table-container">
          <div className="table-header">
            <h3>Danh sách tài khoản</h3>
            <span className="table-count">{accounts.length} tài khoản</span>
          </div>

          <div className="table-wrapper">
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
                        {account.roleName}
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
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Trước
            </button>

            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Sau
            </button>
          </div>
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
