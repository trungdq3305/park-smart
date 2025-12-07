import { useState } from 'react'
import { EnvironmentOutlined, EyeInvisibleOutlined, EyeOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { ParkingLot } from '../../types/ParkingLot'
import parkingIllustration from '../../assets/db5449b9db71eda8231d6f1fd6476623.jpg'
import '../../pages/operator/parking-lot/ParkingLot.css'

interface ParkingLotDetailsProps {
  lot: ParkingLot
}

const ParkingLotDetails: React.FC<ParkingLotDetailsProps> = ({ lot }) => {
  const [isSecretVisible, setIsSecretVisible] = useState(false)
  const totalCapacity = lot.totalCapacityEachLevel * lot.totalLevel
  const occupied = totalCapacity - lot.availableSpots
  const occupancy = totalCapacity === 0 ? 0 : Math.round((occupied / totalCapacity) * 100)

  return (
    <div className="parking-lot-details-section">
      <div className="parking-lot-details-content">
        <div className="parking-lot-details-media">
          <img src={parkingIllustration} alt="Parking lot" />
          <div
            className={`parking-lot-details-status ${
              lot.parkingLotStatus === 'APPROVED' ? 'approved' : 'pending'
            }`}
          >
            {lot.parkingLotStatus}
          </div>
        </div>
        <div className="parking-lot-details-info">
          <div className="parking-lot-details-header">
            <div className="parking-lot-details-title-section">
              <span className="parking-lot-details-label">Tên bãi đỗ xe</span>
              <h2>{lot.name || 'N/A'}</h2>
            </div>
            <div className="parking-lot-details-slot-duration">
              <ClockCircleOutlined />
              <span>{lot.bookingSlotDurationHours}h / slot</span>
            </div>
          </div>

          <div className="parking-lot-details-grid">
            <div className="parking-lot-details-field">
              <span className="parking-lot-details-field-label">Địa chỉ</span>
              <div className="parking-lot-details-field-value">
                <EnvironmentOutlined />
                <span>{lot.addressId?.fullAddress || '—'}</span>
              </div>
            </div>
            <div className="parking-lot-details-field">
              <span className="parking-lot-details-field-label">Kinh độ / Vĩ độ</span>
              <div className="parking-lot-details-field-value">
                <span>
                  {lot.addressId?.latitude?.toFixed(4) ?? '—'} /{' '}
                  {lot.addressId?.longitude?.toFixed(4) ?? '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="parking-lot-details-field">
            <span className="parking-lot-details-field-label">Secret Key (Cho hệ thống IOT)</span>
            <div className="parking-lot-details-secret">
              <span className="parking-lot-details-secret-value">
                {isSecretVisible ? lot.secretKey || '—' : '********'}
              </span>
              <button
                className="parking-lot-details-secret-toggle"
                onClick={() => setIsSecretVisible((prev) => !prev)}
              >
                {isSecretVisible ? (
                  <>
                    <EyeInvisibleOutlined /> Ẩn
                  </>
                ) : (
                  <>
                    <EyeOutlined /> Hiện
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="parking-lot-details-progress-section">
            <div className="parking-lot-details-progress-card">
              <div className="parking-lot-details-progress-header">
                <span className="parking-lot-details-progress-label">Tỷ lệ lấp đầy</span>
                <span className="parking-lot-details-progress-value">{occupancy}%</span>
              </div>
              <div className="parking-lot-details-progress-bar">
                <div
                  className="parking-lot-details-progress-fill"
                  style={{ width: `${occupancy}%` }}
                />
              </div>
              <div className="parking-lot-details-progress-foot">
                {occupied} / {totalCapacity} chỗ
              </div>
            </div>
            <div>
              <div className="parking-lot-details-capacity-grid">
                <div className="parking-lot-details-capacity-card">
                  <div className="parking-lot-details-capacity-label">Bookable</div>
                  <div className="parking-lot-details-capacity-value">{lot.bookableCapacity}</div>
                </div>
                <div className="parking-lot-details-capacity-card">
                  <div className="parking-lot-details-capacity-label">Leased</div>
                  <div className="parking-lot-details-capacity-value">{lot.leasedCapacity}</div>
                </div>
                <div className="parking-lot-details-capacity-card">
                  <div className="parking-lot-details-capacity-label">Walk-in</div>
                  <div className="parking-lot-details-capacity-value">{lot.walkInCapacity}</div>
                </div>
                <div className="parking-lot-details-capacity-card">
                  <div className="parking-lot-details-capacity-label">Mỗi tầng</div>
                  <div className="parking-lot-details-capacity-value">
                    {lot.totalCapacityEachLevel}
                  </div>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps?q=${lot.addressId?.latitude},${lot.addressId?.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="parking-lot-details-map-btn"
              >
                <EnvironmentOutlined />
                <span>Xem trên bản đồ</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ParkingLotDetails
