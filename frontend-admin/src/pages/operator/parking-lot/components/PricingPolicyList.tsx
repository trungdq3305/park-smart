import { Card, Col, Empty, Row, Skeleton, Switch, Tag, Typography, Button } from 'antd'
import { CloseCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { PricingPolicyLink } from '../../../../types/PricingPolicyLink'
import '../ParkingLot.css'

const { Title, Text } = Typography

interface PricingPolicyListProps {
  policies: PricingPolicyLink[]
  loading: boolean
  isDeleted: boolean
  onIsDeletedChange: (isDeleted: boolean) => void
  onOpenCreateModal?: () => void
  onOpenEditModal?: (policy: PricingPolicyLink) => void
  onDelete?: (policyId: string) => void
}

const getPriorityColor = (priority: number): string | undefined => {
  if (priority >= 8 && priority <= 10) {
    return 'green'
  } else if (priority >= 4 && priority <= 7) {
    return 'gold'
  }
  // Priority từ 1-3: default (không set color)
  return undefined
}

const PricingPolicyList: React.FC<PricingPolicyListProps> = ({
  policies,
  loading,
  isDeleted,
  onIsDeletedChange,
  onOpenCreateModal,
  onOpenEditModal,
  onDelete,
}) => {
  return (
    <Card className="policy-card-list">
      <div className="policy-card-list__header">
        <Title level={4} className="policy-card-list__title">
          Chính sách giá
        </Title>
        <div className="policy-card-list__controls">
          {onOpenCreateModal && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onOpenCreateModal}
              style={{ marginRight: 16 }}
            >
              Tạo mới
            </Button>
          )}
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
              const isDisabled = link.endDate != null
              return (
                <Col xs={24} md={12} key={link._id}>
                  <Card className={`policy-card ${isDisabled ? 'policy-card--disabled' : ''}`}>
                    <div className="policy-card__header">
                      <Text className="policy-card__name">{policy.name}</Text>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {isDisabled && (
                          <Tag color="red" icon={<CloseCircleOutlined />}>
                            Đã vô hiệu
                          </Tag>
                        )}
                        <Tag color={getPriorityColor(link.priority)}>Ưu tiên {link.priority}</Tag>
                      </div>
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
                      {isDisabled && link.endDate && (
                        <div>
                          <Text type="secondary">Ngày kết thúc</Text>
                          <div className="policy-card__meta-value" style={{ color: '#ff4d4f' }}>
                            {new Date(link.endDate).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      )}
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
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <Text type="secondary">
                            Tạo lúc:{' '}
                            {link.createdAt
                              ? new Date(link.createdAt).toLocaleString('vi-VN')
                              : '—'}
                          </Text>
                          {link.updatedAt && (
                            <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                              Cập nhật: {new Date(link.updatedAt).toLocaleString('vi-VN')}
                            </Text>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {!isDisabled && onOpenEditModal && (
                            <Button
                              type="primary"
                              icon={<EditOutlined />}
                              onClick={() => onOpenEditModal(link)}
                              size="small"
                            >
                              Chỉnh sửa
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              type="primary"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => onDelete(link._id)}
                              size="small"
                            >
                              Xóa
                            </Button>
                          )}
                        </div>
                      </div>
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

export default PricingPolicyList
