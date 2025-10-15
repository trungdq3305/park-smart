import React, { useState, useMemo } from 'react'
import { Modal, Button, Descriptions, Tag, message, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { MoreOutlined, EyeOutlined, EditOutlined, KeyOutlined, DeleteOutlined, PauseOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { 
  useGetAccountQuery, 
  useDeleteAccountMutation, 
  useToggleAccountStatusMutation 
} from '../../features/accountAPI'
import type { Account } from '../../types/Account'
import './ManageAccountPage.css'

interface ListAccountResponse {
  data: {
    data :{
      pagedAccounts: {
        data: Account[]
        currentPage: number
        pageSize: number
        totalItems: number
      }
  totalAdmins :number
  totalDrivers :number
  totalOperators :number
  totalUsers :number
    }
  }
  isLoading: boolean
}

const ManageAccountPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)

  const { data, isLoading } = useGetAccountQuery<ListAccountResponse>({
    currentPage,
    pageSize
  })

  const [deleteAccount] = useDeleteAccountMutation()
  const [toggleAccountStatus] = useToggleAccountStatusMutation()

  const accounts = data?.data?.pagedAccounts?.data || []
  const totalItems = data?.data?.pagedAccounts?.totalItems || 0
  const totalPages = Math.ceil(totalItems / pageSize)
const totalAdmins = data?.data?.totalAdmins || 0
const totalOperators = data?.data?.totalOperators || 0
const totalDrivers = data?.data?.totalDrivers || 0
  // Filter accounts based on search term and role
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account: Account) => {
      const matchesSearch = 
        account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.phoneNumber.includes(searchTerm) ||
        account.roleName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || account.roleName === roleFilter
      
      return matchesSearch && matchesRole
    })
  }, [accounts, searchTerm, roleFilter])

  const handleViewDetails = (account: Account) => {
    setSelectedAccount(account)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedAccount(null)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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
        isActive: !account.isActive
      }).unwrap()
      message.success(`Trạng thái tài khoản ${account.email} đã được cập nhật!`)
    } catch (error) {
      console.error('Error toggling account status:', error)
      message.error('Có lỗi xảy ra khi cập nhật trạng thái tài khoản!')
    }
  }

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account)
    setShowModal(true)
  }

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'purple'
      case 'operator':
        return 'blue'
      case 'driver':
        return 'orange'
      default:
        return 'default'
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 'badge-active' : 'badge-inactive'
  }

  const getMenuItems = (account: Account): MenuProps['items'] => [
    {
      key: 'view',
      label: 'Xem profile',
      icon: <EyeOutlined />,
      onClick: () => handleViewDetails(account)
    },
    {
      key: 'edit',
      label: 'Chỉnh sửa chi tiết',
      icon: <EditOutlined />,
      onClick: () => handleEditAccount(account)
    },
    {
      key: 'permission',
      label: 'Thay đổi quyền',
      icon: <KeyOutlined />,
      onClick: () => {
        message.info('Tính năng thay đổi quyền đang được phát triển')
      }
    },
    {
      type: 'divider'
    },
    {
      key: 'toggle',
      label: account.isActive ? 'Vô hiệu hóa' : 'Kích hoạt',
      icon: account.isActive ? <PauseOutlined /> : <PlayCircleOutlined />,
      onClick: () => handleToggleStatus(account)
    },
    {
      key: 'delete',
      label: 'Xóa tài khoản',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDeleteAccount(account)
    }
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
        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm theo email, số điện thoại hoặc vai trò..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="search-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="filter-section">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="role-filter"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Admin</option>
              <option value="operator">Operator</option>
              <option value="driver">Driver</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="page-size-select"
            >
              <option value={5}>5 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
        </div>

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
            <span className="table-count">{filteredAccounts.length} tài khoản</span>
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
                {filteredAccounts.map((account: Account) => (
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
                        : 'Chưa đăng nhập'
                      }
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
      <Modal
        title="Chi tiết tài khoản"
        open={showModal}
        onCancel={handleCloseModal}
        width={800}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            Đóng
          </Button>,
          <Button 
            key="edit" 
            type="primary"
            onClick={() => {
              handleCloseModal()
              handleEditAccount(selectedAccount!)
            }}
          >
            Chỉnh sửa
          </Button>
        ]}
      >
        {selectedAccount && (
          <div className="account-details-content">
            <Descriptions title="Thông tin cơ bản" bordered column={2}>
              <Descriptions.Item label="Email">
                {selectedAccount.email}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedAccount.phoneNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                <Tag color={getRoleBadgeColor(selectedAccount.roleName)}>
                  {selectedAccount.roleName}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={selectedAccount.isActive ? 'green' : 'red'}>
                  {selectedAccount.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Lần đăng nhập cuối" span={2}>
                {selectedAccount.lastLoginAt 
                  ? new Date(selectedAccount.lastLoginAt).toLocaleString('vi-VN')
                  : 'Chưa đăng nhập'
                }
              </Descriptions.Item>
            </Descriptions>

            {/* Role-specific details */}
            {selectedAccount.driverDetail && (
              <Descriptions 
                title="Thông tin Driver" 
                bordered 
                column={2}
                style={{ marginTop: 16 }}
              >
                <Descriptions.Item label="Tên đầy đủ">
                  {selectedAccount.driverDetail.fullName}
                </Descriptions.Item>
                <Descriptions.Item label="Giới tính">
                  {selectedAccount.driverDetail.gender ? 'Nam' : 'Nữ'}
                </Descriptions.Item>
                <Descriptions.Item label="Điểm tín dụng">
                  {selectedAccount.driverDetail.creditPoint}
                </Descriptions.Item>
                <Descriptions.Item label="Điểm tích lũy">
                  {selectedAccount.driverDetail.accumulatedPoints}
                </Descriptions.Item>
                <Descriptions.Item label="Xác thực">
                  <Tag color={selectedAccount.driverDetail.isVerified ? 'green' : 'red'}>
                    {selectedAccount.driverDetail.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            )}

            {selectedAccount.operatorDetail && (
              <Descriptions 
                title="Thông tin Operator" 
                bordered 
                column={2}
                style={{ marginTop: 16 }}
              >
                <Descriptions.Item label="Tên đầy đủ">
                  {selectedAccount.operatorDetail.fullName}
                </Descriptions.Item>
                <Descriptions.Item label="Tên công ty">
                  {selectedAccount.operatorDetail.companyName}
                </Descriptions.Item>
                <Descriptions.Item label="Mã số thuế">
                  {selectedAccount.operatorDetail.taxCode}
                </Descriptions.Item>
                <Descriptions.Item label="Email liên hệ">
                  {selectedAccount.operatorDetail.contactEmail}
                </Descriptions.Item>
                <Descriptions.Item label="Xác thực">
                  <Tag color={selectedAccount.operatorDetail.isVerified ? 'green' : 'red'}>
                    {selectedAccount.operatorDetail.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            )}

            {selectedAccount.adminDetail && (
              <Descriptions 
                title="Thông tin Admin" 
                bordered 
                column={2}
                style={{ marginTop: 16 }}
              >
                <Descriptions.Item label="Tên đầy đủ">
                  {selectedAccount.adminDetail.fullName}
                </Descriptions.Item>
                <Descriptions.Item label="Phòng ban">
                  {selectedAccount.adminDetail.department}
                </Descriptions.Item>
                <Descriptions.Item label="Chức vụ">
                  {selectedAccount.adminDetail.position}
                </Descriptions.Item>
              </Descriptions>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xác nhận xóa tài khoản"
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        width={500}
        footer={[
          <Button key="cancel" onClick={() => setShowDeleteConfirm(false)}>
            Hủy
          </Button>,
          <Button 
            key="delete" 
            type="primary" 
            danger
            onClick={confirmDeleteAccount}
          >
            Xóa tài khoản
          </Button>
        ]}
      >
        {accountToDelete && (
          <div className="delete-confirmation-content">
            <div className="warning-section">
              <div className="warning-icon">⚠️</div>
              <div className="warning-text">
                <h3>Bạn có chắc chắn muốn xóa tài khoản này?</h3>
                <p>
                  Tài khoản <strong>{accountToDelete.email}</strong> sẽ bị xóa vĩnh viễn và không thể khôi phục.
                </p>
              </div>
            </div>
            
            <div className="account-preview">
              <div className="account-avatar">
                {accountToDelete.email.charAt(0).toUpperCase()}
              </div>
              <div className="account-info">
                <h4>{accountToDelete.email}</h4>
                <p>{accountToDelete.phoneNumber}</p>
                <Tag color={getRoleBadgeColor(accountToDelete.roleName)}>
                  {accountToDelete.roleName}
                </Tag>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ManageAccountPage
