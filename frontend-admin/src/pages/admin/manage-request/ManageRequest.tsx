import { useMemo, useState } from 'react'
import { Card, Tag, Table, Select, Space, Typography, Tooltip, Button, Badge } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EditOutlined, EyeOutlined } from '@ant-design/icons'
import { useParkingLotRequestsQuery } from '../../../features/admin/parkinglotAPI'
import type { ParkingLotRequest } from '../../../types/ParkingLotRequest'
import './ManageRequest.css'

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
  const [status, setStatus] = useState<RequestStatusValue>(RequestStatus.PENDING)
  const [type, setType] = useState<RequestTypeValue>(RequestType.UPDATE)

  const { data, isLoading } = useParkingLotRequestsQuery({
    status,
    type,
  })

  const parkingLotRequests: ParkingLotRequest[] = data?.data || []

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
            <Button size="small" icon={<EyeOutlined />} />
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
              onChange={(value) => setStatus(value)}
              style={{ width: 220 }}
            />
          </div>
          <div className="filter-item">
            <span className="filter-label">Loại yêu cầu</span>
            <Select
              value={type}
              options={typeOptions}
              onChange={(value) => setType(value)}
              style={{ width: 220 }}
            />
          </div>
        </Space>
      </div>

      <Card className="request-table-card">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={parkingLotRequests}
          loading={isLoading}
          pagination={false}
          className="request-table"
        />
      </Card>
    </div>
  )
}

export default ManageRequest