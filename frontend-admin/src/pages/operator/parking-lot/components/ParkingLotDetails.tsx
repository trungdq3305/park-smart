import { useState } from 'react'
import { Button, Card, Col, Progress, Row, Space, Tag, Typography } from 'antd'
import { ClockCircleOutlined, EnvironmentOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'
import type { ParkingLot } from '../../../../types/ParkingLot'
import parkingIllustration from '../../../../assets/db5449b9db71eda8231d6f1fd6476623.jpg'

const { Title, Text } = Typography

interface ParkingLotDetailsProps {
  lot: ParkingLot
}

const ParkingLotDetails: React.FC<ParkingLotDetailsProps> = ({ lot }) => {
  const [isSecretVisible, setIsSecretVisible] = useState(false)
  const totalCapacity = lot.totalCapacityEachLevel * lot.totalLevel
  const occupied = totalCapacity - lot.availableSpots
  const occupancy = totalCapacity === 0 ? 0 : Math.round((occupied / totalCapacity) * 100)

  return (
    <Card className="area-card area-card--single">
      <Row gutter={[24, 24]} align="middle">
        <Col xs={24} md={10}>
          <div className="area-card__media">
            <img src={parkingIllustration} alt="Parking lot" />
            <Tag
              color={lot.parkingLotStatus === 'APPROVED' ? 'green' : 'orange'}
              className="area-card__status"
            >
              {lot.parkingLotStatus}
            </Tag>
          </div>
        </Col>
        <Col xs={24} md={14}>
          <Space direction="vertical" className="area-card__content" size={16}>
            <div className="area-card__header">
              <div>
                <Text type="secondary">Tên bãi đỗ xe</Text>
                <Title level={4} className="area-card__title">
                  {lot.name || 'N/A'}
                </Title>
              </div>
              <Button size="small" icon={<ClockCircleOutlined />}>
                {lot.bookingSlotDurationHours}h / slot
              </Button>
            </div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">Địa chỉ</Text>
                <div className="area-card__text">
                  <EnvironmentOutlined /> {lot.addressId?.fullAddress || '—'}
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Kinh độ / Vĩ độ</Text>
                <div className="area-card__text compact">
                  {lot.addressId?.latitude?.toFixed(4) ?? '—'} /{' '}
                  {lot.addressId?.longitude?.toFixed(4) ?? '—'}
                </div>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Text type="secondary">Secret Key (Cho hệ thống IOT)</Text>
                <div className="area-card__text compact" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{isSecretVisible ? lot.secretKey || '—' : '********'}</span>
                  <Button
                    size="small"
                    type="link"
                    icon={isSecretVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    onClick={() => setIsSecretVisible((prev) => !prev)}
                  >
                    {isSecretVisible ? 'Ẩn' : 'Hiện'}
                  </Button>
                </div>
              </Col>
            </Row>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={12}>
                <div className="area-card__progress">
                  <div className="area-card__progress-head">
                    <Text>Tỷ lệ lấp đầy</Text>
                    <strong>{occupancy}%</strong>
                  </div>
                  <Progress percent={occupancy} showInfo={false} strokeColor="#1890ff" />
                  <div className="area-card__progress-foot">
                    {occupied} / {totalCapacity} chỗ
                  </div>
                  <div>
                  </div>
                </div>
                <div className="area-card__map-button">
                  <Button
                    type="default"
                    href={`https://www.google.com/maps?q=${lot.addressId?.latitude},${lot.addressId?.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    icon={<EnvironmentOutlined />}
                  >
                    Xem trên bản đồ
                  </Button>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="capacity-grid">
                  <div className="capacity-card">
                    <Text type="secondary">Bookable</Text>
                    <strong>{lot.bookableCapacity}</strong>
                  </div>
                  <div className="capacity-card">
                    <Text type="secondary">Leased</Text>
                    <strong>{lot.leasedCapacity}</strong>
                  </div>
                  <div className="capacity-card">
                    <Text type="secondary">Walk-in</Text>
                    <strong>{lot.walkInCapacity}</strong>
                  </div>
                  <div className="capacity-card">
                    <Text type="secondary">Mỗi tầng</Text>
                    <strong>{lot.totalCapacityEachLevel}</strong>
                  </div>
                </div>
              </Col>
            </Row>
          </Space>
        </Col>
      </Row>
    </Card>
  )
}

export default ParkingLotDetails
