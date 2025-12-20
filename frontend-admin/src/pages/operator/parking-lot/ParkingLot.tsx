import { useEffect, useMemo, useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  CarOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  UserOutlined,
  EditOutlined,
} from '@ant-design/icons'
import {
  useGetParkingLotsOperatorQuery,
  useUpdateParkingLotRequestMutation,
} from '../../../features/operator/parkingLotAPI'
import { useGetParkingLotRequestOfOperatorQuery } from '../../../features/admin/parkinglotAPI'
import type { ParkingLot } from '../../../types/ParkingLot'
import './ParkingLot.css'
import type { Pagination } from '../../../types/Pagination'
import {
  useCreatePricingPolicyLinkMutation,
  useGetPricingPoliciesOperatorQuery,
  useDeletePricingPolicyLinkMutation,
} from '../../../features/operator/pricingPolicyAPI'
import ParkingLotDetails from '../../../components/parking-lot/ParkingLotDetails'
import PricingPolicyList from '../../../components/parking-lot/PricingPolicyList'
import CreatePricingPolicyModal from '../../../components/parking-lot/CreatePricingPolicyModal'
import UpdateParkingLotModal from '../../../components/parking-lot/UpdateParkingLotModal'
import type { PricingPolicyLink } from '../../../types/PricingPolicyLink'
import type { Basis } from '../../../types/Basis'
import { useGetBasisQuery } from '../../../features/operator/basisAPI'
import { message, Modal } from 'antd'
import OperatorRequestsModal from '../../../components/parking-lot/OperatorRequestsModal'
import CreateParkingLotRequestModal from '../../../components/parking-lot/CreateParkingLotRequestModal'
import Cookies from 'js-cookie'
import { useOperatorId } from '../../../hooks/useOperatorId'

interface ParkingLotsListResponse {
  data: {
    data: ParkingLot[]
  }
  isLoading: boolean
}

interface PricingPoliciesListResponse {
  data: {
    data: PricingPolicyLink[]
    pagination: Pagination
  }
  isLoading: boolean
}
interface BasisListResponse {
  data: {
    data: Basis[]
  }
  isLoading: boolean
}

const OperatorParkingLot: React.FC = () => {
  const operatorId = useOperatorId()
  const [isDeleted, setIsDeleted] = useState(false)
  const [isSwitchLoading, setIsSwitchLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedPolicyForEdit, setSelectedPolicyForEdit] = useState<PricingPolicyLink | null>(null)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false)
  const [isCreateRequestModalOpen, setIsCreateRequestModalOpen] = useState(false)
  const { data, isLoading } = useGetParkingLotsOperatorQuery<ParkingLotsListResponse>({})
  const [updateParkingLotRequest, { isLoading: isUpdateParkingLotRequestLoading }] =
    useUpdateParkingLotRequestMutation()
  const parkingLot = data?.data?.[0] ?? null

  const { data: pricingPoliciesData, isLoading: isPricingLoading } =
    useGetPricingPoliciesOperatorQuery<PricingPoliciesListResponse>(
      parkingLot?._id
        ? {
            parkingLotId: parkingLot._id,
            page: 1,
            pageSize: 10,
            isDeleted,
          }
        : skipToken
    )
  const { data: parkingLotRequestsData, isLoading: isRequestLoading } =
    useGetParkingLotRequestOfOperatorQuery(
      operatorId ? { parkingLotOperatorId: operatorId } : skipToken
    )
  const { data: basisData } = useGetBasisQuery<BasisListResponse>({})
  const basis = basisData?.data ?? []

  const [createPricingPolicyLink, { isLoading: isCreatePricingLoading }] =
    useCreatePricingPolicyLinkMutation()
  const [deletePricingPolicyLink, { isLoading: isDeletePricingLoading }] =
    useDeletePricingPolicyLinkMutation()

  const pricingPolicies = pricingPoliciesData?.data ?? []

  const handleIsDeletedChange = (newValue: boolean) => {
    setIsSwitchLoading(true)
    setTimeout(() => {
      setIsDeleted(newValue)
      setTimeout(() => {
        setIsSwitchLoading(false)
      }, 300)
    }, 500)
  }

  const handleCreatePricingPolicy = async (values: any) => {
    try {
      await createPricingPolicyLink(values).unwrap()
      message.success('Tạo chính sách giá thành công')
      setIsCreateModalOpen(false)
    } catch (error: any) {
      message.error(error?.data?.message || 'Tạo chính sách giá thất bại')
    }
  }

  const handleEditPricingPolicy = async (values: any) => {
    try {
      if (selectedPolicyForEdit?._id) {
        await deletePricingPolicyLink(selectedPolicyForEdit._id).unwrap()
      }
      await createPricingPolicyLink(values).unwrap()
      message.success('Cập nhật chính sách giá thành công')
      setIsEditModalOpen(false)
      setSelectedPolicyForEdit(null)
    } catch (error: any) {
      message.error(error?.data?.message || 'Cập nhật chính sách giá thất bại')
    }
  }

  const handleOpenEditModal = (policy: PricingPolicyLink) => {
    setSelectedPolicyForEdit(policy)
    setIsEditModalOpen(true)
  }

  const handleDeletePricingPolicy = (policyId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa chính sách giá',
      content: 'Bạn có chắc chắn muốn xóa chính sách giá này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const result = await deletePricingPolicyLink(policyId).unwrap()
          message.success(result?.message || 'Xóa chính sách giá thành công')
        } catch (error: any) {
          message.error(error?.data?.message || 'Xóa chính sách giá thất bại')
        }
      },
    })
  }

  const handleUpdateParkingLot = async (values: any) => {
    if (!parkingLot?._id) return

    try {
      await updateParkingLotRequest({
        parkingLotId: parkingLot._id,
        updateRequestDto: values,
      }).unwrap()
      message.success('Gửi yêu cầu cập nhật thành công!')
      setIsUpdateModalOpen(false)
    } catch (error: any) {
      message.error(error?.data?.message || 'Gửi yêu cầu cập nhật thất bại')
    }
  }

  const summary = useMemo(() => {
    if (!parkingLot) {
      return {
        totalCapacity: 0,
        availableSpots: 0,
        totalBookable: 0,
        totalLeased: 0,
        totalWalkIn: 0,
        occupancyRate: 0,
        bookingSlotDurationHours: 0,
      }
    }
    const totalCapacity = parkingLot.totalCapacityEachLevel * parkingLot.totalLevel
    const availableSpots = parkingLot.availableSpots
    const totalBookable = parkingLot.bookableCapacity
    const totalLeased = parkingLot.leasedCapacity
    const totalWalkIn = parkingLot.walkInCapacity
    const occupancyRate =
      totalCapacity === 0 ? 0 : Math.round(((totalCapacity - availableSpots) / totalCapacity) * 100)
    const bookingSlotDurationHours = parkingLot.bookingSlotDurationHours || 0

    return {
      totalCapacity,
      availableSpots,
      totalBookable,
      totalLeased,
      totalWalkIn,
      occupancyRate,
      bookingSlotDurationHours,
    }
  }, [parkingLot])

  useEffect(() => {
    if (!Cookies.get('parkingLotId') && parkingLot?._id) {
      Cookies.set('parkingLotId', parkingLot._id)
    }
  }, [parkingLot])

  const operatorRequests = useMemo(() => {
    if (!parkingLotRequestsData) return []
    if (Array.isArray(parkingLotRequestsData)) return parkingLotRequestsData
    // support { data: [...] } or { data: { data: [...] } }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return (parkingLotRequestsData as any).data || (parkingLotRequestsData as any).data || []
  }, [parkingLotRequestsData])

  if (isLoading) {
    return (
      <div className="parking-lot-page">
        <div className="parking-lot-loading">
          <div className="parking-lot-loading-spinner" />
          <p>Đang tải thông tin bãi đỗ xe...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="parking-lot-page">
      <div className="parking-lot-page-header">
        <div className="parking-lot-header-content">
          <div>
            <h1>Quản lý bãi đỗ xe</h1>
            <p>Theo dõi hiệu suất vận hành và tình trạng bãi đỗ của bạn</p>
          </div>
          {parkingLot && (
            <div className="parking-lot-header-actions">
              <button
                className="parking-lot-secondary-btn"
                onClick={() => setIsRequestsModalOpen(true)}
              >
                <span>Yêu cầu đã gửi</span>
              </button>
              <button className="parking-lot-update-btn" onClick={() => setIsUpdateModalOpen(true)}>
                <EditOutlined />
                <span>Gửi yêu cầu cập nhật</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="parking-lot-page-content">
        {!parkingLot ? (
          <div className="parking-lot-empty-state">
            <div className="parking-lot-empty-icon">🚗</div>
            <h3 className="parking-lot-empty-title">Chưa có bãi đỗ xe</h3>
            <p className="parking-lot-empty-text">
              Bạn chưa có bãi đỗ nào được duyệt. Hãy tạo yêu cầu bãi đỗ xe mới để được xét duyệt.
            </p>
            {operatorId && (
              <button
                className="parking-lot-create-request-btn"
                onClick={() => setIsCreateRequestModalOpen(true)}
              >
                <span>➕</span>
                <span>Tạo yêu cầu bãi đỗ xe mới</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Stats Section */}
            <div className="parking-lot-stats-section">
              <div className="parking-lot-stat-card">
                <div className="parking-lot-stat-icon total">
                  <CarOutlined />
                </div>
                <div className="parking-lot-stat-content">
                  <h3>{summary.totalCapacity}</h3>
                  <p>Tổng sức chứa</p>
                  <div className="parking-lot-stat-sub">Tổng số chỗ đỗ</div>
                </div>
              </div>
              <div className="parking-lot-stat-card">
                <div className="parking-lot-stat-icon available">
                  <CheckCircleOutlined />
                </div>
                <div className="parking-lot-stat-content">
                  <h3>{summary.availableSpots}</h3>
                  <p>Chỗ còn trống</p>
                  <div className="parking-lot-stat-sub">Chỗ đỗ khả dụng</div>
                </div>
              </div>
              <div className="parking-lot-stat-card">
                <div className="parking-lot-stat-icon occupancy">
                  <ThunderboltOutlined />
                </div>
                <div className="parking-lot-stat-content">
                  <h3>{summary.occupancyRate}%</h3>
                  <p>Tỷ lệ lấp đầy</p>
                  <div className="parking-lot-stat-sub">Mức độ sử dụng</div>
                </div>
              </div>
              <div className="parking-lot-stat-card">
                <div className="parking-lot-stat-icon levels">
                  <UserOutlined />
                </div>
                <div className="parking-lot-stat-content">
                  <h3>{summary.bookingSlotDurationHours}h</h3>
                  <p>TB thời gian</p>
                  <div className="parking-lot-stat-sub">Thời gian đặt chỗ</div>
                </div>
              </div>
              <div className="parking-lot-stat-card">
                <div className="parking-lot-stat-icon bookable">
                  <CarOutlined />
                </div>
                <div className="parking-lot-stat-content">
                  <h3>{summary.totalBookable}</h3>
                  <p>Bookable</p>
                  <div className="parking-lot-stat-sub">Chỗ đặt trước</div>
                </div>
              </div>
              <div className="parking-lot-stat-card">
                <div className="parking-lot-stat-icon leased">
                  <CarOutlined />
                </div>
                <div className="parking-lot-stat-content">
                  <h3>{summary.totalLeased}</h3>
                  <p>Leased</p>
                  <div className="parking-lot-stat-sub">Chỗ thuê dài hạn</div>
                </div>
              </div>
            </div>

            {/* Parking Lot Details */}
            <ParkingLotDetails lot={parkingLot} />

            {/* Pricing Policies */}
            <PricingPolicyList
              policies={pricingPolicies}
              loading={isPricingLoading || isSwitchLoading}
              isDeleted={isDeleted}
              onIsDeletedChange={handleIsDeletedChange}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onOpenEditModal={handleOpenEditModal}
              onDelete={handleDeletePricingPolicy}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <CreatePricingPolicyModal
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePricingPolicy}
        parkingLotId={parkingLot?._id || ''}
        basisList={basis}
        loading={isCreatePricingLoading}
      />
      <CreatePricingPolicyModal
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false)
          setSelectedPolicyForEdit(null)
        }}
        onSubmit={handleEditPricingPolicy}
        parkingLotId={parkingLot?._id || ''}
        basisList={basis}
        loading={isCreatePricingLoading || isDeletePricingLoading}
        initialData={selectedPolicyForEdit}
        isEditMode={true}
      />
      <UpdateParkingLotModal
        open={isUpdateModalOpen}
        onCancel={() => setIsUpdateModalOpen(false)}
        onSubmit={handleUpdateParkingLot}
        parkingLot={parkingLot}
        loading={isUpdateParkingLotRequestLoading}
      />
      <OperatorRequestsModal
        open={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
        requests={operatorRequests}
        loading={isRequestLoading}
      />
      {operatorId && (
        <CreateParkingLotRequestModal
          open={isCreateRequestModalOpen}
          onClose={() => setIsCreateRequestModalOpen(false)}
          operatorId={operatorId}
        />
      )}
    </div>
  )
}

export default OperatorParkingLot
