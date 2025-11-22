import { useMemo, useState } from 'react'
import { Card, Col, Empty, Row, Skeleton, Typography } from 'antd'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  CarOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useGetParkingLotsOperatorQuery } from '../../../features/operator/parkingLotAPI'
import type { ParkingLot } from '../../../types/ParkingLot'
import './ParkingLot.css'
import type { Pagination } from '../../../types/Pagination'
import {
  useCreatePricingPolicyLinkMutation,
  useGetPricingPoliciesOperatorQuery,
  useDeletePricingPolicyLinkMutation,
} from '../../../features/operator/pricingPolicyAPI'
import ParkingLotDetails from './components/ParkingLotDetails'
import StatCard from './components/StatCard'
import PricingPolicyList from './components/PricingPolicyList'
import CreatePricingPolicyModal from './components/CreatePricingPolicyModal'
import type { PricingPolicyLink } from '../../../types/PricingPolicyLink'
import type { Basis } from '../../../types/Basis'
import { useGetBasisQuery } from '../../../features/operator/basisAPI'
import { message } from 'antd'

const { Title, Text } = Typography

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
  const [isDeleted, setIsDeleted] = useState(false)
  const [isSwitchLoading, setIsSwitchLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedPolicyForEdit, setSelectedPolicyForEdit] = useState<PricingPolicyLink | null>(null)

  const { data, isLoading } = useGetParkingLotsOperatorQuery<ParkingLotsListResponse>({})
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
  const { data: basisData } = useGetBasisQuery<BasisListResponse>({})
  const basis = basisData?.data ?? []

  const [createPricingPolicyLink, { isLoading: isCreatePricingLoading }] =
    useCreatePricingPolicyLinkMutation()
  const [deletePricingPolicyLink, { isLoading: isDeletePricingLoading }] =
    useDeletePricingPolicyLinkMutation()

  const pricingPolicies = pricingPoliciesData?.data ?? []

  const handleIsDeletedChange = (newValue: boolean) => {
    setIsSwitchLoading(true)
    // Set timeout để hiển thị hiệu ứng loading (tối thiểu 500ms)
    setTimeout(() => {
      setIsDeleted(newValue)
      // Đợi thêm một chút để đảm bảo query đã hoàn thành
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
      // Tạo mới pricing policy với dữ liệu đã chỉnh sửa
      await createPricingPolicyLink(values).unwrap()

      // Tự động disable pricing policy cũ bằng cách delete
      if (selectedPolicyForEdit?._id) {
        await deletePricingPolicyLink(selectedPolicyForEdit._id).unwrap()
      }

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

  const summary = useMemo(() => {
    if (!parkingLot) {
      return {
        totalCapacity: 0,
        availableSpots: 0,
        totalBookable: 0,
        totalLeased: 0,
        totalWalkIn: 0,
        occupancyRate: 0,
      }
    }

    const totalCapacity = parkingLot.totalCapacityEachLevel * parkingLot.totalLevel
    const availableSpots = parkingLot.availableSpots
    const totalBookable = parkingLot.bookableCapacity
    const totalLeased = parkingLot.leasedCapacity
    const totalWalkIn = parkingLot.walkInCapacity
    const occupancyRate =
      totalCapacity === 0 ? 0 : Math.round(((totalCapacity - availableSpots) / totalCapacity) * 100)

    return {
      totalCapacity,
      availableSpots,
      totalBookable,
      totalLeased,
      totalWalkIn,
      occupancyRate,
    }
  }, [parkingLot])

  if (isLoading) {
    return (
      <div className="parking-lot-page">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    )
  }

  return (
    <div className="parking-lot-page">
      <div className="page-header">
        <div>
          <Title level={3} className="page-header__title">
            Quản lý bãi đỗ xe
          </Title>
          <Text type="secondary">Theo dõi hiệu suất vận hành và tình trạng bãi đỗ của bạn</Text>
        </div>
      </div>

      <Row gutter={[16, 16]} className="overview-grid">
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Tổng sức chứa" value={summary.totalCapacity} icon={<CarOutlined />} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Chỗ còn trống"
            value={summary.availableSpots}
            icon={<CheckCircleOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Tỷ lệ lấp đầy"
            value={summary.occupancyRate}
            suffix="%"
            icon={<ThunderboltOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Số tầng" value={parkingLot?.totalLevel ?? 0} icon={<UserOutlined />} />
        </Col>
      </Row>

      {!parkingLot ? (
        <Card className="area-card area-card--empty">
          <Empty description="Bạn chưa có bãi đỗ nào được duyệt" />
        </Card>
      ) : (
        <>
          <ParkingLotDetails lot={parkingLot} />
          <PricingPolicyList
            policies={pricingPolicies}
            loading={isPricingLoading || isSwitchLoading}
            isDeleted={isDeleted}
            onIsDeletedChange={handleIsDeletedChange}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenEditModal={handleOpenEditModal}
          />
          <CreatePricingPolicyModal
            open={isCreateModalOpen}
            onCancel={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreatePricingPolicy}
            parkingLotId={parkingLot._id}
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
            parkingLotId={parkingLot._id}
            basisList={basis}
            loading={isCreatePricingLoading || isDeletePricingLoading}
            initialData={selectedPolicyForEdit}
            isEditMode={true}
          />
        </>
      )}
    </div>
  )
}

export default OperatorParkingLot
