import { useMemo, useState } from 'react'
import { Card, Tag, Table, Select, Space, Typography, Tooltip, Button, Badge, Modal, Descriptions, Empty } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { EditOutlined, EyeOutlined } from '@ant-design/icons'
import { useParkingLotRequestsQuery } from '../../../features/admin/parkinglotAPI'
import type { ParkingLotRequest } from '../../../types/ParkingLotRequest'
import './ManageRequest.css'
import { useSearchParams } from 'react-router-dom'

const RequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  APPLIED: 'APPLIED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const

const RequestType = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const

type RequestStatusValue = (typeof RequestStatus)[keyof typeof RequestStatus]
type RequestTypeValue = (typeof RequestType)[keyof typeof RequestType]

const statusOptions: { label: string; value: RequestStatusValue }[] = [
  { label: 'Đang chờ duyệt', value: RequestStatus.PENDING },
  { label: 'Đã duyệt', value: RequestStatus.APPROVED },
  { label: 'Đã từ chối', value: RequestStatus.REJECTED },
  { label: 'Đã áp dụng', value: RequestStatus.APPLIED },
  { label: 'Thất bại', value: RequestStatus.FAILED },
  { label: 'Đã hủy', value: RequestStatus.CANCELLED },
]

const typeOptions: { label: string; value: RequestTypeValue }[] = [
  { label: 'Yêu cầu tạo mới', value: RequestType.CREATE },
  { label: 'Yêu cầu cập nhật', value: RequestType.UPDATE },
  { label: 'Yêu cầu xóa', value: RequestType.DELETE },
]

const statusTagColor: Record<RequestStatusValue, string> = {
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
  APPLIED: 'blue',
  FAILED: 'volcano',
  CANCELLED: 'default',
}

const typeTagColor: Record<RequestTypeValue, string> = {
  CREATE: 'geekblue',
  UPDATE: 'cyan',
  DELETE: 'magenta',
}

const ManageRequest: React.FC = () => {
  const [status, setStatus] = useState<RequestStatusValue>(
    (window.location.search && (new URLSearchParams(window.location.search).get('status') as RequestStatusValue)) ||
      RequestStatus.PENDING,
  )
  const [type, setType] = useState<RequestTypeValue>(
    (window.location.search && (new URLSearchParams(window.location.search).get('type') as RequestTypeValue)) ||
      RequestType.UPDATE,
  )
  const [selectedRequest, setSelectedRequest] = useState<ParkingLotRequest | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  // Get values from URL parameters with defaults
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = 5 // Fixed page size, not from URL

  const { data, isLoading } = useParkingLotRequestsQuery({
    status,
    type,
    page: currentPage,
    pageSize,
  })

  const parkingLotRequests: ParkingLotRequest[] = data?.data || []
  const totalRequests = parkingLotRequests.length

  const pagedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return parkingLotRequests.slice(start, start + pageSize)
  }, [parkingLotRequests, currentPage])

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

  const handleStatusChange = (value: RequestStatusValue) => {
    setStatus(value)
    updateSearchParams({ status: value, page: 1 })
  }

  const handleTypeChange = (value: RequestTypeValue) => {
    setType(value)
    updateSearchParams({ type: value, page: 1 })
  }

  const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current && pagination.current !== currentPage) {
      updateSearchParams({ page: pagination.current })
    }
  }

  const stats = useMemo(() => {
    const total = parkingLotRequests.length
    const pending = parkingLotRequests.filter((r: ParkingLotRequest) => r.status === RequestStatus.PENDING).length
    const approved = parkingLotRequests.filter((r: ParkingLotRequest) => r.status === RequestStatus.APPROVED).length
    const rejected = parkingLotRequests.filter((r: ParkingLotRequest) => r.status === RequestStatus.REJECTED).length

    return { total, pending, approved, rejected }
  }, [parkingLotRequests])

  const columns: ColumnsType<ParkingLotRequest> = [
    {
      title: 'Bãi đỗ xe',
      dataIndex: ['payload', 'name'],
      key: 'name',
      render: (_name, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{record.payload.name}</Typography.Text>
          <Typography.Text type="secondary" ellipsis style={{ maxWidth: 260 }}>
            {record.payload.addressId?.fullAddress}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Loại yêu cầu',
      dataIndex: 'requestType',
      key: 'requestType',
      render: (requestType: RequestTypeValue) => (
        <Tag color={typeTagColor[requestType]}>
          {typeOptions.find((t) => t.value === requestType)?.label}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (value: RequestStatusValue) => (
        <Tag color={statusTagColor[value]}>{statusOptions.find((s) => s.value === value)?.label}</Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => new Date(value).toLocaleString('vi-VN'),
    },
    {
      title: 'Ngày hiệu lực',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      render: (value: string) => new Date(value).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết yêu cầu">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedRequest(record)
                setIsDetailModalOpen(true)
              }}
            />
          </Tooltip>
          <Tooltip title="Xử lý yêu cầu">
            <Button size="small" type="primary" icon={<EditOutlined />} disabled={record.status !== 'PENDING'} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div className="manage-request-page">
      <div className="page-header">
        <div>
          <Typography.Title level={3} className="page-title">
            Yêu cầu thay đổi bãi đỗ xe
          </Typography.Title>
          <Typography.Text type="secondary">
            Theo dõi và phê duyệt các yêu cầu tạo mới / cập nhật / xóa bãi đỗ xe từ Operator
          </Typography.Text>
        </div>
        <Space size="large">
          <div className="header-stat">
            <Badge status="processing" />
            <span>Đang chờ duyệt: </span>
            <strong>{stats.pending}</strong>
          </div>
          <div className="header-stat">
            <Badge status="success" />
            <span>Đã duyệt: </span>
            <strong>{stats.approved}</strong>
          </div>
          <div className="header-stat">
            <Badge status="error" />
            <span>Đã từ chối: </span>
            <strong>{stats.rejected}</strong>
          </div>
        </Space>
      </div>

      <div className="filters-row">
        <Space size="middle">
          <div className="filter-item">
            <span className="filter-label">Trạng thái</span>
            <Select
              value={status}
              options={statusOptions}
              onChange={handleStatusChange}
              style={{ width: 220 }}
            />
          </div>
          <div className="filter-item">
            <span className="filter-label">Loại yêu cầu</span>
            <Select
              value={type}
              options={typeOptions}
              onChange={handleTypeChange}
              style={{ width: 220 }}
            />
          </div>
        </Space>
      </div>

      <Card className="request-table-card">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={pagedRequests}
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize,
            total: totalRequests,
            showSizeChanger: false,
            responsive: true,
          }}
          onChange={handleTableChange}
          className="request-table"
          locale={{
            emptyText: isLoading
              ? 'Đang tải dữ liệu...'
              : (
                  <Empty
                    description="Không có yêu cầu nào phù hợp với bộ lọc hiện tại"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
          }}
        />
      </Card>

      <Modal
        open={isDetailModalOpen}
        title="Chi tiết yêu cầu bãi đỗ xe"
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={720}
      >
        {selectedRequest && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions column={2} bordered size="small" labelStyle={{ width: 180 }}>
              <Descriptions.Item label="Tên bãi đỗ xe">{selectedRequest.payload.name}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái yêu cầu">
                <Tag color={statusTagColor[selectedRequest.status as RequestStatusValue]}>
                  {statusOptions.find((s) => s.value === selectedRequest.status)?.label ||
                    selectedRequest.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Loại yêu cầu">
                <Tag color={typeTagColor[selectedRequest.requestType as RequestTypeValue]}>
                  {typeOptions.find((t) => t.value === selectedRequest.requestType)?.label ||
                    selectedRequest.requestType}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {new Date(selectedRequest.createdAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày hiệu lực">
                {new Date(selectedRequest.effectiveDate).toLocaleDateString('vi-VN')}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions
              title="Thông tin bãi đỗ xe"
              column={2}
              bordered
              size="small"
              labelStyle={{ width: 180 }}
            >
              <Descriptions.Item label="Địa chỉ">
                {selectedRequest.payload.addressId?.fullAddress}
              </Descriptions.Item>
              <Descriptions.Item label="Vị trí">
                {`${selectedRequest.payload.addressId?.latitude}, ${selectedRequest.payload.addressId?.longitude}`}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tầng">
                {selectedRequest.payload.totalLevel}
              </Descriptions.Item>
              <Descriptions.Item label="Sức chứa mỗi tầng">
                {selectedRequest.payload.totalCapacityEachLevel}
              </Descriptions.Item>
              <Descriptions.Item label="Sức chứa đặt chỗ">
                {selectedRequest.payload.bookableCapacity}
              </Descriptions.Item>
              <Descriptions.Item label="Sức chứa gói tháng">
                {selectedRequest.payload.leasedCapacity}
              </Descriptions.Item>
              <Descriptions.Item label="Sức chứa gửi lượt">
                {selectedRequest.payload.walkInCapacity}
              </Descriptions.Item>
              <Descriptions.Item label="Thời lượng slot đặt chỗ (giờ)">
                {selectedRequest.payload.bookingSlotDurationHours}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default ManageRequest