import { Modal, Button, Spin, Alert, Space, Descriptions, Tag } from 'antd'
import { useParkingLotRequestDetailQuery } from '../../features/admin/parkinglotAPI'
import type { ParkingLotRequest } from '../../types/ParkingLotRequest'

type Option = { label: string; value: string }

interface RequestDetailModalProps {
  open: boolean
  request: ParkingLotRequest | null
  onClose: () => void
  statusOptions: Option[]
  typeOptions: Option[]
  statusTagColor: Record<string, string>
  typeTagColor: Record<string, string>
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  open,
  request,
  onClose,
  statusOptions,
  typeOptions,
  statusTagColor,
  typeTagColor,
}) => {
  const shouldFetchRequestDetail = Boolean(open && request?._id && request?.requestType === 'UPDATE')

  const {
    data: requestDetail,
    isLoading: isRequestDetailLoading,
    error: requestDetailError,
  } = useParkingLotRequestDetailQuery(
    { id: request?._id || '' },
    { skip: !shouldFetchRequestDetail },
  )

  const detailRecordRaw = requestDetail?.data ?? requestDetail
  const detailRecord = Array.isArray(detailRecordRaw) ? detailRecordRaw[0] : detailRecordRaw

  const resolvedRequest = (shouldFetchRequestDetail && detailRecord
    ? (detailRecord as ParkingLotRequest)
    : request) as ParkingLotRequest | null

  if (!request) {
    return null
  }

  return (
    <Modal
      open={open}
      title="Chi tiết yêu cầu bãi đỗ xe"
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={720}
    >
      {shouldFetchRequestDetail && isRequestDetailLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Spin tip="Đang tải chi tiết yêu cầu..." />
        </div>
      ) : shouldFetchRequestDetail && requestDetailError ? (
        <Alert
          type="error"
          message="Không thể tải chi tiết yêu cầu"
          description={(requestDetailError as any)?.data?.message || 'Vui lòng thử lại sau.'}
          showIcon
        />
      ) : resolvedRequest ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions column={2} bordered size="small" labelStyle={{ width: 180 }}>
            <Descriptions.Item label="Tên bãi đỗ xe">{resolvedRequest.payload?.name}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái yêu cầu">
              <Tag color={statusTagColor[resolvedRequest.status] || 'default'}>
                {statusOptions.find((s) => s.value === resolvedRequest.status)?.label || resolvedRequest.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Loại yêu cầu">
              <Tag color={typeTagColor[resolvedRequest.requestType] || 'default'}>
                {typeOptions.find((t) => t.value === resolvedRequest.requestType)?.label ||
                  resolvedRequest.requestType}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {resolvedRequest.createdAt ? new Date(resolvedRequest.createdAt).toLocaleString('vi-VN') : '--'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày hiệu lực">
              {resolvedRequest.effectiveDate
                ? new Date(resolvedRequest.effectiveDate).toLocaleDateString('vi-VN')
                : '--'}
            </Descriptions.Item>
          </Descriptions>

          <Descriptions title="Thông tin bãi đỗ xe theo yêu cầu" column={2} bordered size="small" labelStyle={{ width: 180 }}>
            <Descriptions.Item label="Tên bãi đỗ xe">
              {resolvedRequest.payload?.name || 'Chưa cập nhật'}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">
              {resolvedRequest.payload?.addressId?.fullAddress || 'Chưa cập nhật'}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tầng">
              {resolvedRequest.payload?.totalLevel ?? 'Chưa cập nhật'}
            </Descriptions.Item>
            <Descriptions.Item label="Sức chứa mỗi tầng">
              {resolvedRequest.payload?.totalCapacityEachLevel ?? 'Chưa cập nhật'}
            </Descriptions.Item>
            <Descriptions.Item label="Sức chứa đặt chỗ">
              {resolvedRequest.payload?.bookableCapacity ?? 'Chưa cập nhật'}
            </Descriptions.Item>
            <Descriptions.Item label="Sức chứa gói tháng">
              {resolvedRequest.payload?.leasedCapacity ?? 'Chưa cập nhật'}
            </Descriptions.Item>
            <Descriptions.Item label="Sức chứa gửi lượt">
              {resolvedRequest.payload?.walkInCapacity ?? 'Chưa cập nhật'}
            </Descriptions.Item>
            <Descriptions.Item label="Thời lượng slot đặt chỗ (giờ)">
              {resolvedRequest.payload?.bookingSlotDurationHours ?? 'Chưa cập nhật'}
            </Descriptions.Item>
          </Descriptions>

          {resolvedRequest.parkingLotId && (
            <Descriptions title="Thông tin bãi đỗ xe hiện tại" column={2} bordered size="small" labelStyle={{ width: 180 }}>
              <Descriptions.Item label="Tên bãi đỗ xe">
                {resolvedRequest.parkingLotId.name || 'Không xác định'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag
                  color={
                    (resolvedRequest.parkingLotId.parkingLotStatus &&
                      statusTagColor[resolvedRequest.parkingLotId.parkingLotStatus]) ||
                    'default'
                  }
                >
                  {resolvedRequest.parkingLotId.parkingLotStatus || 'Không xác định'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tầng">
                {resolvedRequest.parkingLotId.totalLevel ?? 'Không xác định'}
              </Descriptions.Item>
              <Descriptions.Item label="Sức chứa mỗi tầng">
                {resolvedRequest.parkingLotId.totalCapacityEachLevel ?? 'Không xác định'}
              </Descriptions.Item>
              <Descriptions.Item label="Sức chứa đặt chỗ">
                {resolvedRequest.parkingLotId.bookableCapacity ?? 'Không xác định'}
              </Descriptions.Item>
              <Descriptions.Item label="Sức chứa gói tháng">
                {resolvedRequest.parkingLotId.leasedCapacity ?? 'Không xác định'}
              </Descriptions.Item>
              <Descriptions.Item label="Sức chứa gửi lượt">
                {resolvedRequest.parkingLotId.walkInCapacity ?? 'Không xác định'}
              </Descriptions.Item>
              <Descriptions.Item label="Số chỗ khả dụng hiển thị">
                {resolvedRequest.parkingLotId.availableSpots ?? 'Không xác định'}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Space>
      ) : null}
    </Modal>
  )
}

export default RequestDetailModal

