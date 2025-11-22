import { useMemo, useState } from 'react'
import { Card, Col, Empty, Row, Skeleton, Switch, Tag, Typography } from 'antd'
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
import { useGetPricingPoliciesOperatorQuery } from '../../../features/operator/pricingPolicyAPI'
import ParkingLotDetails from './components/ParkingLotDetails'
import StatCard from './components/StatCard'
import type { PricingPolicyLink } from '../../../types/PricingPolicyLink'

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

const OperatorParkingLot: React.FC = () => {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isDeleted, setIsDeleted] = useState(false)

  const { data, isLoading } = useGetParkingLotsOperatorQuery<ParkingLotsListResponse>({})
  const parkingLot = data?.data?.[0] ?? null
  const { data: pricingPoliciesData, isLoading: isPricingLoading } =
    useGetPricingPoliciesOperatorQuery<PricingPoliciesListResponse>(
      parkingLot?._id
        ? {
            parkingLotId: parkingLot._id,
            page,
            pageSize,
            isDeleted,
          }
        : skipToken
    )
  const pricingPolicies = pricingPoliciesData?.data ?? []


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
            loading={isPricingLoading}
            isDeleted={isDeleted}
            onIsDeletedChange={setIsDeleted}
          />
        </>
      )}
    </div>
  )
}

interface PricingPolicyListProps {
  policies: PricingPolicyLink[]
  loading: boolean
  isDeleted: boolean
  onIsDeletedChange: (isDeleted: boolean) => void
}

const PricingPolicyList: React.FC<PricingPolicyListProps> = ({
  policies,
  loading,
  isDeleted,
  onIsDeletedChange,
}) => {
  return (
    <Card className="policy-card-list">
      <div className="policy-card-list__header">
        <Title level={4} className="policy-card-list__title">
          Chính sách giá
        </Title>
        <div className="policy-card-list__controls">
          <div>
            <Text type="secondary" style={{ marginRight: 8 }}>
              Hiển thị đã xóa:
            </Text>
            <Switch checked={isDeleted} onChange={onIsDeletedChange} />
          </div>
        </div>
      </div>
      {loading ? (
        <Skeleton active />
      ) : policies.length === 0 ? (
        <Empty description="Chưa có chính sách giá" />
      ) : (
        <Row gutter={[16, 16]}>
          {policies
            .slice()
            .sort((a, b) =>
              (a.pricingPolicyId.basisId?.basisName || '').localeCompare(
                b.pricingPolicyId.basisId?.basisName || ''
              )
            )
            .map((link) => {
              const policy = link.pricingPolicyId
              const isPackage = policy.basisId?.basisName === 'PACKAGE'
              const isTiered = policy.basisId?.basisName === 'TIERED'
              return (
                <Col xs={24} md={12} key={link._id}>
                  <Card className="policy-card">
                    <div className="policy-card__header">
                      <Text className="policy-card__name">{policy.name}</Text>
                      <Tag color="blue">Ưu tiên {link.priority}</Tag>
                    </div>

                    <div className="policy-card__meta">
                      <div>
                        <Text type="secondary">Giá mỗi giờ</Text>
                        <div className="policy-card__meta-value">
                          {policy.pricePerHour != null
                            ? `${policy.pricePerHour.toLocaleString()} đ`
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <Text type="secondary">Giá cố định</Text>
                        <div className="policy-card__meta-value">
                          {policy.fixedPrice != null
                            ? `${policy.fixedPrice.toLocaleString()} đ`
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <Text type="secondary">Ngày áp dụng</Text>
                        <div className="policy-card__meta-value">
                          {new Date(link.startDate).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>

                    <Text type="secondary">Loại chính sách</Text>
                    <Text className="policy-card__description">
                      {policy.basisId?.basisName || 'Không xác định'} -
                      {policy.basisId?.description || 'Không có mô tả'}
                    </Text>

                    {isPackage && policy.packageRateId && (
                      <div className="policy-card__section">
                        <Text type="secondary">Gói cố định</Text>
                        <div className="policy-card__package">
                          <div>
                            <Text type="secondary">Tên gói</Text>
                            <div className="policy-card__meta-value">
                              {policy.packageRateId.name}
                            </div>
                          </div>
                          <div>
                            <Text type="secondary">Giá gói</Text>
                            <div className="policy-card__meta-value">
                              {policy.packageRateId.price.toLocaleString()} đ
                            </div>
                          </div>
                          <div>
                            <Text type="secondary">Thời lượng</Text>
                            <div className="policy-card__meta-value">
                              {policy.packageRateId.durationAmount} {policy.packageRateId.unit}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {isTiered && policy.tieredRateSetId && (
                      <div className="policy-card__section">
                        <Text type="secondary">Bảng giá theo khung giờ</Text>
                        <div className="policy-card__tiers">
                          <Text strong>{policy.tieredRateSetId.name}</Text>
                          {policy.tieredRateSetId.tiers.map((tier, index) => (
                            <div className="policy-card__tier-row" key={index}>
                              <span>
                                {tier.fromHour} - {tier.toHour ?? '∞'}
                              </span>
                              <span>{tier.price.toLocaleString()} đ</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="policy-card__footer">
                      <Text type="secondary">
                        Tạo lúc:{' '}
                        {link.createdAt ? new Date(link.createdAt).toLocaleString('vi-VN') : '—'}
                      </Text>
                      {link.updatedAt && (
                        <Text type="secondary">
                          Cập nhật: {new Date(link.updatedAt).toLocaleString('vi-VN')}
                        </Text>
                      )}
                    </div>
                  </Card>
                </Col>
              )
            })}
        </Row>
      )}
    </Card>
  )
}

export default OperatorParkingLot
