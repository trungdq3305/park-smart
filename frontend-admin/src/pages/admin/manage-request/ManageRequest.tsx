import { useMemo, useState } from 'react'
import {
  Card,
  Tag,
  Table,
  Select,
  Space,
  Typography,
  Tooltip,
  Button,
  Badge,
  Empty,
  Modal,
  Input,
  notification,
} from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import {
  useParkingLotRequestsQuery,
  useReviewParkingLotRequestMutation,
} from '../../../features/admin/parkinglotAPI'
import type { ParkingLotRequest } from '../../../types/ParkingLotRequest'
import './ManageRequest.css'
import { useSearchParams } from 'react-router-dom'
import { RequestDetailModal } from '../../../components/modals'

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
    (window.location.search &&
      (new URLSearchParams(window.location.search).get('status') as RequestStatusValue)) ||
      RequestStatus.PENDING
  )
  const [type, setType] = useState<RequestTypeValue>(
    (window.location.search &&
      (new URLSearchParams(window.location.search).get('type') as RequestTypeValue)) ||
      RequestType.UPDATE
  )
  const [selectedRequest, setSelectedRequest] = useState<ParkingLotRequest | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [requestBeingReviewed, setRequestBeingReviewed] = useState<ParkingLotRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [reviewParkingLotRequest, { isLoading: isReviewLoading }] =
    useReviewParkingLotRequestMutation()

  // Get values from URL parameters with defaults
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = 5 // Fixed page size, not from URL

  const { data, isLoading, error } = useParkingLotRequestsQuery({
    status,
    type,
    page: currentPage,
    pageSize,
  })

  const parkingLotRequests: ParkingLotRequest[] = data?.data || []
  const totalRequests = parkingLotRequests.length

  const apiError = error as any
  const isNoDataError = apiError?.status === 404

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
    const pending = parkingLotRequests.filter(
      (r: ParkingLotRequest) => r.status === RequestStatus.PENDING
    ).length
    const approved = parkingLotRequests.filter(
      (r: ParkingLotRequest) => r.status === RequestStatus.APPROVED
    ).length
    const rejected = parkingLotRequests.filter(
      (r: ParkingLotRequest) => r.status === RequestStatus.REJECTED
    ).length

    return { total, pending, approved, rejected }
  }, [parkingLotRequests])

  const handleApproveRequest = async (record: ParkingLotRequest) => {
    try {
      await reviewParkingLotRequest({
        requestId: record._id,
        status: RequestStatus.APPROVED,
        rejectionReason: undefined,
      }).unwrap()

      notification.success({
        message: 'Chấp thuận yêu cầu thành công',
        description: `Yêu cầu bãi đỗ xe "${record.payload.name}" đã được chấp thuận.`,
      })
    } catch (err: any) {
      notification.error({
        message: 'Chấp thuận yêu cầu thất bại',
        description: err?.data?.message || 'Đã có lỗi xảy ra, vui lòng thử lại.',
      })
    }
  }

  const openRejectModal = (record: ParkingLotRequest) => {
    setRequestBeingReviewed(record)
    setRejectReason('')
    setIsRejectModalOpen(true)
  }

  const handleCancelRejectModal = () => {
    setIsRejectModalOpen(false)
    setRejectReason('')
    setRequestBeingReviewed(null)
  }

  const handleConfirmReject = async () => {
    if (!requestBeingReviewed) return

    try {
      await reviewParkingLotRequest({
        requestId: requestBeingReviewed._id,
        status: RequestStatus.REJECTED,
        rejectionReason: rejectReason.trim(),
      }).unwrap()

      notification.success({
        message: 'Từ chối yêu cầu thành công',
        description: `Yêu cầu bãi đỗ xe "${requestBeingReviewed.payload.name}" đã bị từ chối.`,
      })

      handleCancelRejectModal()
    } catch (err: any) {
      notification.error({
        message: 'Từ chối yêu cầu thất bại',
        description: err?.data?.message || 'Đã có lỗi xảy ra, vui lòng thử lại.',
      })
    }
  }

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
        <Tag color={statusTagColor[value]}>
          {statusOptions.find((s) => s.value === value)?.label}
        </Tag>
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
      width: 260,
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
          <Tooltip title="Chấp thuận yêu cầu">
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              aria-label="Chấp thuận yêu cầu"
              disabled={record.status !== RequestStatus.PENDING || isReviewLoading}
              onClick={() => handleApproveRequest(record)}
            />
          </Tooltip>
          <Tooltip title="Từ chối yêu cầu">
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              aria-label="Từ chối yêu cầu"
              disabled={record.status !== RequestStatus.PENDING}
              onClick={() => openRejectModal(record)}
            />
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
        {isNoDataError ? (
          <Empty
            description={
              apiError?.data?.message ||
              'Không tìm thấy yêu cầu bãi đỗ xe nào. Vui lòng điều chỉnh bộ lọc hoặc thử lại sau.'
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
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
              emptyText: isLoading ? (
                'Đang tải dữ liệu...'
              ) : (
                <Empty
                  description="Không có yêu cầu nào phù hợp với bộ lọc hiện tại"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        )}
      </Card>

      <Modal
        open={isRejectModalOpen}
        title="Lý do từ chối yêu cầu"
        onCancel={handleCancelRejectModal}
        onOk={handleConfirmReject}
        okText="Từ chối"
        okButtonProps={{ danger: true, disabled: !rejectReason.trim(), loading: isReviewLoading }}
        cancelText="Hủy"
      >
        <Typography.Paragraph>
          Vui lòng nhập lý do từ chối cho yêu cầu bãi đỗ xe
          {requestBeingReviewed ? ` "${requestBeingReviewed.payload.name}"` : ''}.
        </Typography.Paragraph>
        <Input.TextArea
          rows={4}
          placeholder="Nhập lý do từ chối..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      <RequestDetailModal
        open={isDetailModalOpen}
        request={selectedRequest}
        onClose={() => setIsDetailModalOpen(false)}
        statusOptions={statusOptions}
        typeOptions={typeOptions}
        statusTagColor={statusTagColor}
        typeTagColor={typeTagColor}
      />
    </div>
  )
}

export default ManageRequest
