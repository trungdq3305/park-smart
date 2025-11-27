import React from 'react'
import { Modal, Button, Descriptions, Tag, message } from 'antd'
import type { Account } from '../../types/Account'
import { useAccountDetailsQuery, useConfirmOperatorMutation } from '../../features/admin/accountAPI'
import { useParkingLotDetailsQuery, useReviewParkingLotRequestMutation } from '../../features/admin/parkinglotAPI'
import type { ParkingLotRequest } from '../../types/ParkingLotRequest'
import type { Address } from '../../types/Address'
import { useGetAddressByIdQuery } from '../../features/operator/addressAPI'

interface AccountDetailsModalProps {
  open: boolean
  onClose: () => void
  account: Account | null
}
interface ParkingLotRequestReponse {
  data :{
    data : ParkingLotRequest[]
  }
}
interface AddressResponse{
  data:{
    data:Address[]
  }
  isLoading:boolean
}
const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({ open, onClose, account }) => {

  const [confirmOperator, { isLoading: isConfirmingOperator }] = useConfirmOperatorMutation()
  const { data: accountDetails } = useAccountDetailsQuery(account?._id || '')
  const operatorId =accountDetails?.data?.operatorDetail?._id || ''

  const { data: parkingLotDetails } = useParkingLotDetailsQuery<ParkingLotRequestReponse>({
    parkingLotOperatorId: operatorId,
    status: 'PENDING',
    type: 'CREATE',
  })
  
  const parkingLotDetailsData = parkingLotDetails?.data?.[0]
  const addressId = parkingLotDetailsData?.payload?.addressId
  const requestId = parkingLotDetailsData?._id

  const { data: addressDetails } = useGetAddressByIdQuery<AddressResponse>({id: addressId})

  const [reviewParkingLotRequest, { isLoading: isReviewingParkingLotRequest }] = useReviewParkingLotRequestMutation()

  const addressDetailsData = addressDetails?.data?.[0] || null

  const handleConfirmOperator = async () => {
    if (!account?._id) return
    try {
      await confirmOperator(account._id).unwrap()
      message.success('Xác nhận tài khoản operator thành công')
    } catch (error) {
      const backendMessage =
        (error as { data?: { message?: string; error?: string } })?.data?.message ||
        (error as { data?: { message?: string; error?: string } })?.data?.error
      message.error(backendMessage || 'Xác nhận tài khoản operator thất bại')
    }
  }

  const handleReviewParkingLotRequest = async () => {
    if (requestId) {
      await reviewParkingLotRequest({requestId}).unwrap()
      message.success('Duyệt bãi đỗ xe thành công')
    }
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

  return (
    <Modal
      title="Chi tiết tài khoản"
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      {account && (
        <div className="account-details-content">
          <Descriptions title="Thông tin cơ bản" bordered column={2}>
            <Descriptions.Item label="Email">{account.email}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{account.phoneNumber}</Descriptions.Item>
            <Descriptions.Item label="Vai trò">
              <Tag color={getRoleBadgeColor(account.roleName)}>{account.roleName}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={account.isActive ? 'green' : 'red'}>
                {account.isActive ? 'Hoạt động' : 'Không hoạt động'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Lần đăng nhập cuối" span={2}>
              {account.lastLoginAt
                ? new Date(account.lastLoginAt).toLocaleString('vi-VN')
                : 'Chưa đăng nhập'}
            </Descriptions.Item>
          </Descriptions>

          {/* Role-specific details */}
          {account.driverDetail && (
            <Descriptions title="Thông tin Driver" bordered column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="Tên đầy đủ">
                {account.driverDetail.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                {account.driverDetail.gender ? 'Nam' : 'Nữ'}
              </Descriptions.Item>
              <Descriptions.Item label="Điểm tín dụng">
                {account.driverDetail.creditPoint}
              </Descriptions.Item>
              <Descriptions.Item label="Điểm tích lũy">
                {account.driverDetail.accumulatedPoints}
              </Descriptions.Item>
              <Descriptions.Item label="Xác thực">
                <Tag color={account.driverDetail.isVerified ? 'green' : 'red'}>
                  {account.driverDetail.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          )}

          {account.operatorDetail && (
            <Descriptions title="Thông tin Operator" bordered column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="Tên đầy đủ">
                {account.operatorDetail.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Tên doanh nghiệp">
                {account.operatorDetail.bussinessName}
              </Descriptions.Item>
              <Descriptions.Item label="Mã số thuế">
                {account.operatorDetail.taxCode ? account.operatorDetail.taxCode : 'Không có'}
              </Descriptions.Item>
              <Descriptions.Item label="Email thanh toán">
                {account.operatorDetail.paymentEmail
                  ? account.operatorDetail.paymentEmail
                  : 'Không có'}
              </Descriptions.Item>
              <Descriptions.Item label="Xác thực">
                <Tag color={account.operatorDetail.isVerified ? 'green' : 'red'}>
                  {account.operatorDetail.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Duyệt tài khoản">
                <Button
                  type="primary"
                  onClick={handleConfirmOperator}
                  loading={isConfirmingOperator}
                >
                  {isConfirmingOperator ? 'Đang duyệt...' : 'Duyệt'}
                </Button>
              </Descriptions.Item>
            </Descriptions>
          )}

          {account.operatorDetail && parkingLotDetailsData && (
            <Descriptions title="Bãi xe đăng ký" bordered column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="Tên bãi xe">
                {parkingLotDetailsData.payload?.name || 'Chưa cung cấp'}
              </Descriptions.Item>
              <Descriptions.Item label="Loại yêu cầu">
                {parkingLotDetailsData.requestType}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái yêu cầu">
                <Tag color="blue">{parkingLotDetailsData.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {addressDetailsData?.fullAddress || 'Chưa cung cấp'}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tầng">
                {parkingLotDetailsData.payload?.totalLevel ?? 'Chưa cung cấp'}
              </Descriptions.Item>
              <Descriptions.Item label="Sức chứa mỗi tầng">
                {parkingLotDetailsData.payload?.totalCapacityEachLevel ?? 'Chưa cung cấp'}
              </Descriptions.Item>
              <Descriptions.Item label="Sức chứa đặt trước">
                {parkingLotDetailsData.payload?.bookableCapacity ?? 'Chưa cung cấp'}
              </Descriptions.Item>
              <Descriptions.Item label="Sức chứa thuê dài hạn">
                {parkingLotDetailsData.payload?.leasedCapacity ?? 'Chưa cung cấp'}
              </Descriptions.Item>
              <Descriptions.Item label="Sức chứa vãng lai">
                {parkingLotDetailsData.payload?.walkInCapacity ?? 'Chưa cung cấp'}
              </Descriptions.Item>
              <Descriptions.Item label="Thời lượng slot (giờ)">
                {parkingLotDetailsData.payload?.bookingSlotDurationHours ?? 'Chưa cung cấp'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày hiệu lực">
                {parkingLotDetailsData.effectiveDate
                  ? new Date(parkingLotDetailsData.effectiveDate).toLocaleDateString('vi-VN')
                  : 'Chưa xác định'}
              </Descriptions.Item>
              <Descriptions.Item label="Duyệt bãi đỗ xe">
                <Button
                  type="primary"
                  onClick={handleReviewParkingLotRequest}
                  loading={isReviewingParkingLotRequest}
                >
                  {isReviewingParkingLotRequest ? 'Đang duyệt...' : 'Duyệt'}
                </Button>
              </Descriptions.Item>
            </Descriptions>
          )}

          {account.adminDetail && (
            <Descriptions title="Thông tin Admin" bordered column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="Tên đầy đủ">
                {account.adminDetail.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Phòng ban">
                {account.adminDetail.department}
              </Descriptions.Item>
              <Descriptions.Item label="Chức vụ">{account.adminDetail.position}</Descriptions.Item>
            </Descriptions>
          )}

        </div>
      )}
    </Modal>
  )
}

export default AccountDetailsModal
