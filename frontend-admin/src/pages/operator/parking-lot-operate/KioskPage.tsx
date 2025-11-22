/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react'
import {
  Card,
  Button,
  Input,
  Row,
  Col,
  Tag,
  Statistic,
  Descriptions,
  Typography,
  notification as antdNotification,
  Space,
  Badge,
  Divider,
} from 'antd'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'
import {
  VideoCameraOutlined,
  CameraOutlined,
  CarOutlined,
  ScanOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  LoginOutlined,
  LogoutOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'

import Success from '../../../assets/success.mp3'
import { useLocalGateway } from '../../../hooks/useLocalGateway'
import SettingsModal from '../../../components/SettingsModal'
import './KioskPage.css'

const { Title, Text } = Typography

// 👇 Cấu hình URL API NestJS (Thay đổi theo môi trường của bạn)
const NEST_API_BASE = 'http://localhost:5000'
const CURRENT_PARKING_ID = '6910bdd67ed4c382df23de4e' // ID bãi xe hiện tại

interface ScanData {
  identifier: string
  plateNumber?: string
  image?: string
  timestamp?: number
  type?: string
}

const KioskPage: React.FC = () => {
  // Hook quản lý Gateway URL
  const { gatewayUrl, saveGatewayUrl } = useLocalGateway()
  const LIVE_STREAM_URL = `${gatewayUrl}/video_feed`

  // State
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [snapshot, setSnapshot] = useState<string | null>(null)

  // Data hiển thị
  const [cardUid, setCardUid] = useState<string>('---')
  const [plateNumber, setPlateNumber] = useState<string>('')
  const [timeIn, setTimeIn] = useState<string>('---')
  const [timeOut, setTimeOut] = useState<string>('---')
  const [customerType, setCustomerType] = useState<string>('---')
  const [parkingFee, setParkingFee] = useState<number>(0)
  const [message, setMessage] = useState<string>('Sẵn sàng quét thẻ...')

  // ⭐️ STATE QUẢN LÝ CHẾ ĐỘ (VÀO hay RA)
  const [mode, setMode] = useState<'CHECK_IN' | 'CHECK_OUT' | 'IDLE'>('IDLE')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [sessionData, setSessionData] = useState<any>(null) // Dữ liệu phiên (nếu check-out)

  const socketRef = useRef<Socket | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [api, contextHolder] = antdNotification.useNotification()

  useEffect(() => {
    audioRef.current = new Audio(Success)
    audioRef.current.load()
  }, [])

  const playBeep = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }

  // --- XỬ LÝ KHI QUÉT THẺ / BIỂN SỐ ---
  const handleNewScan = async (data: ScanData) => {
    playBeep()
    setIsLoading(true)

    // 1. Cập nhật UI cơ bản từ Socket
    if (data.image) setSnapshot(data.image)
    setCardUid(data.identifier)
    if (data.plateNumber) setPlateNumber(data.plateNumber)

    try {
      // 2. GỌI API STATUS CHECK (Hàm bạn vừa hỏi)
      // Để biết xe này đang ở Ngoài (cần vào) hay Trong (cần ra)
      const statusRes = await axios.get(`${NEST_API_BASE}/parking-sessions/status/check`, {
        params: {
          identifier: data.identifier,
          parkingLotId: CURRENT_PARKING_ID,
        },
      })

      const { state } = statusRes.data

      if (state === 'INSIDE') {
        // ===> CHẾ ĐỘ CHECK-OUT (XE RA) <===
        setMode('CHECK_OUT')
        setMessage('Xe ra - Đang tính phí...')

        // Gọi tiếp API tính tiền
        const feeRes = await axios.post(
          `${NEST_API_BASE}/parking-lot-sessions/checkout/calculate`,
          {
            identifier: data.identifier,
            parkingLotId: CURRENT_PARKING_ID,
          }
        )

        const checkoutInfo = feeRes.data
        setSessionData(checkoutInfo) // Lưu thông tin để nút bấm sử dụng

        // Hiển thị thông tin tính toán
        setTimeIn(new Date(checkoutInfo.checkInTime).toLocaleString('vi-VN'))
        setTimeOut(new Date(checkoutInfo.checkOutTime).toLocaleString('vi-VN'))
        setParkingFee(checkoutInfo.totalAmount)
        setCustomerType(checkoutInfo.description || 'Khách vãng lai')

        api.info({
          message: 'Xe ra',
          description: `Phí: ${checkoutInfo.totalAmount.toLocaleString('vi-VN')} đ`,
        })
      } else {
        // ===> CHẾ ĐỘ CHECK-IN (XE VÀO) <===
        setMode('CHECK_IN')
        setMessage('Xe vào - Xác nhận biển số')

        // Reset các trường cũ
        setTimeIn(new Date().toLocaleString('vi-VN'))
        setTimeOut('---')
        setParkingFee(0)
        setCustomerType('Khách vào')
        setSessionData(null)

        // (Tùy chọn) Gọi thêm API lookup thẻ để biết tên khách, loại vé tháng...
        api.success({
          message: 'Xe vào',
          description: 'Vui lòng xác nhận biển số',
        })
      }
    } catch (error) {
      console.error(error)
      api.error({ message: 'Lỗi kiểm tra trạng thái xe' })
      setMode('IDLE')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    socketRef.current = io(gatewayUrl, { transports: ['websocket'] })

    socketRef.current.on('connect', () => {
      setIsConnected(true)
      api.success({ message: 'Kết nối máy quét thành công' })
    })

    socketRef.current.on('disconnect', () => setIsConnected(false))

    socketRef.current.on('nfc_scanned', (data: ScanData) => handleNewScan({ ...data, type: 'NFC' }))
    socketRef.current.on('scan_result', (data: ScanData) => handleNewScan({ ...data, type: 'QR' }))

    return () => {
      socketRef.current?.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatewayUrl])

  // --- HÀM XỬ LÝ NÚT BẤM ---
  const handleMainAction = async () => {
    if (mode === 'IDLE') return
    setIsLoading(true)

    try {
      if (mode === 'CHECK_IN') {
        // Gọi API Check-in
        await axios.post(`${NEST_API_BASE}/parking-lot-sessions/check-in/${CURRENT_PARKING_ID}`, {
          plateNumber: plateNumber,
          identifier: cardUid,
        })
        api.success({ message: 'Mở cổng vào thành công!' })
      } else {
        // Gọi API Confirm Check-out
        if (!sessionData) return

        await axios.post(`${NEST_API_BASE}/parking-lot-sessions/checkout/confirm`, {
          sessionId: sessionData.sessionId,
          paymentId: undefined, // Tiền mặt
          pricingPolicyId: sessionData.pricingPolicyId,
        })
        api.success({ message: 'Thanh toán xong. Mở cổng ra!' })
      }

      // Reset về trạng thái chờ sau khi xong
      setMode('IDLE')
      setSnapshot(null)
      setPlateNumber('')
      setCardUid('---')
      setMessage('Sẵn sàng quét thẻ...')
    } catch (error: any) {
      api.error({
        message: 'Thao tác thất bại',
        description: error.response?.data?.message || 'Lỗi Server',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Cancel
  const handleCancel = () => {
    setMode('IDLE')
    setSnapshot(null)
    setMessage('Đã hủy bỏ. Sẵn sàng quét mới.')
  }

  return (
    <div className="kiosk-layout">
      {contextHolder}
      <SettingsModal currentUrl={gatewayUrl} onSave={saveGatewayUrl} />

      {/* Custom Header */}
      <header className="kiosk-header">
        <div className="kiosk-header-left">
          <div className="kiosk-header-icon">
            <CarOutlined />
          </div>
          <div>
            <Title level={3} className="kiosk-header-title" style={{ color: 'white' }}>
              HỆ THỐNG KIỂM SOÁT BÃI ĐỖ XE
            </Title>
            <Text className="kiosk-header-subtitle" style={{ color: 'white' }}>
              Kiosk Bảo Vệ - Cổng Số 1
            </Text>
          </div>
        </div>
        <Space size="large">
          <Badge
            status={isConnected ? 'success' : 'error'}
            text={
              <Text strong className="kiosk-header-status-text">
                {isConnected ? 'KẾT NỐI' : 'MẤT KẾT NỐI'}
              </Text>
            }
          />
          <Tag color={isConnected ? 'success' : 'error'} className="kiosk-header-tag">
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </Tag>
        </Space>
      </header>

      <main className="kiosk-content">
        <Row gutter={[20, 20]} style={{ height: '100%' }}>
          {/* Cột trái: Camera */}
          <Col span={16} className="kiosk-camera-col">
            {/* Live Stream */}
            <Card
              title={
                <Space>
                  <VideoCameraOutlined className="kiosk-card-title-icon" />
                  <Text strong className="kiosk-card-title">
                    Camera Giám Sát
                  </Text>
                </Space>
              }
              className="kiosk-camera-card"
              styles={{
                body: {
                  padding: 0,
                  background: '#000',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: '0 0 8px 8px',
                },
              }}
            >
              <img
                src={LIVE_STREAM_URL}
                className="kiosk-camera-image"
                alt="Live Stream"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML =
                      '<div style="color: #666; font-size: 16px;">Đang kết nối camera...</div>'
                  }
                }}
              />
            </Card>

            {/* Snapshot */}
            <Card
              title={
                <Space>
                  <CameraOutlined className="kiosk-card-title-icon" />
                  <Text strong className="kiosk-card-title">
                    Ảnh Chụp Tức Thời
                  </Text>
                </Space>
              }
              className="kiosk-snapshot-card"
              styles={{
                body: {
                  padding: 0,
                  background: '#1a1a1a',
                  height: 'calc(100% - 57px)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: '0 0 8px 8px',
                },
              }}
            >
              {snapshot ? (
                <img src={snapshot} className="kiosk-snapshot-image" alt="Snapshot" />
              ) : (
                <div className="kiosk-snapshot-placeholder">
                  <CameraOutlined className="kiosk-snapshot-placeholder-icon" />
                  <Text style={{ color: 'white' }}>Chờ tín hiệu quét thẻ...</Text>
                </div>
              )}
            </Card>
          </Col>

          {/* Cột phải: Thông tin & Hành động */}
          <Col span={8}>
            <Card
              title={
                <Text strong className="kiosk-transaction-title">
                  THÔNG TIN GIAO DỊCH
                </Text>
              }
              className="kiosk-transaction-card"
              styles={{
                body: {
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 24,
                },
              }}
            >
              {/* Trạng thái hiện tại */}
              <div className={`kiosk-status-card ${mode.toLowerCase().replace('_', '-')}`}>
                <div className={`kiosk-status-icon ${mode.toLowerCase().replace('_', '-')}`}>
                  {mode === 'CHECK_IN' && <LoginOutlined />}
                  {mode === 'CHECK_OUT' && <LogoutOutlined />}
                  {mode === 'IDLE' && <ScanOutlined />}
                </div>
                <Title
                  level={3}
                  className={`kiosk-status-title ${mode.toLowerCase().replace('_', '-')}`}
                >
                  {message}
                </Title>
              </div>

              {/* Biển số xe */}
              <div className="kiosk-plate-section">
                <Text strong className="kiosk-plate-label">
                  Biển Số Xe
                </Text>
                <Input
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  prefix={<CarOutlined className="kiosk-plate-input-icon" />}
                  suffix={<EditOutlined className="kiosk-plate-input-suffix" />}
                  size="large"
                  className="kiosk-plate-input"
                  placeholder="Nhập biển số"
                />
              </div>

              <Divider style={{ margin: '16px 0' }} />

              {/* Thông tin chi tiết */}
              <Descriptions
                column={1}
                bordered
                size="small"
                className="kiosk-descriptions"
                labelStyle={{ background: '#fafafa', fontWeight: 600, width: '40%' }}
                contentStyle={{ background: '#fff' }}
              >
                <Descriptions.Item
                  label={
                    <Space>
                      <ScanOutlined />
                      <span>Mã Thẻ</span>
                    </Space>
                  }
                >
                  <Text strong className="kiosk-descriptions-text">
                    {cardUid}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <Space>
                      <UserOutlined />
                      <span>Loại Khách</span>
                    </Space>
                  }
                >
                  <Tag color="blue" className="kiosk-descriptions-tag">
                    {customerType}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <Space>
                      <ClockCircleOutlined />
                      <span>Giờ Vào</span>
                    </Space>
                  }
                >
                  <Text className="kiosk-descriptions-text-small">{timeIn}</Text>
                </Descriptions.Item>
                {mode === 'CHECK_OUT' && (
                  <Descriptions.Item
                    label={
                      <Space>
                        <ClockCircleOutlined />
                        <span>Giờ Ra</span>
                      </Space>
                    }
                  >
                    <Text className="kiosk-descriptions-text-small">{timeOut}</Text>
                  </Descriptions.Item>
                )}
              </Descriptions>

              {/* Phí cần thu */}
              {mode === 'CHECK_OUT' && parkingFee > 0 && (
                <div className="kiosk-fee-card">
                  <Text strong className="kiosk-fee-label">
                    Phí Cần Thu
                  </Text>
                  <Statistic
                    value={parkingFee}
                    suffix="VNĐ"
                    valueStyle={{ color: '#cf1322', fontWeight: 700, fontSize: 36 }}
                    prefix={<DollarOutlined className="kiosk-fee-icon" />}
                  />
                </div>
              )}

              {/* Nút hành động */}
              <div className="kiosk-actions">
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={
                    mode === 'CHECK_IN' ? (
                      <LoginOutlined className="kiosk-main-button-icon" />
                    ) : mode === 'CHECK_OUT' ? (
                      <CheckCircleOutlined className="kiosk-main-button-icon" />
                    ) : (
                      <ScanOutlined className="kiosk-main-button-icon" />
                    )
                  }
                  className={`kiosk-main-button ${mode.toLowerCase().replace('_', '-')}`}
                  onClick={handleMainAction}
                  loading={isLoading}
                  disabled={mode === 'IDLE'}
                >
                  {mode === 'CHECK_IN'
                    ? 'XÁC NHẬN VÀO'
                    : mode === 'CHECK_OUT'
                      ? 'THANH TOÁN & RA'
                      : 'CHỜ QUÉT THẺ...'}
                </Button>

                <Button
                  danger
                  block
                  size="large"
                  icon={<CloseCircleOutlined className="kiosk-cancel-button-icon" />}
                  onClick={handleCancel}
                  disabled={mode === 'IDLE'}
                  className="kiosk-cancel-button"
                >
                  HỦY BỎ
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </main>
    </div>
  )
}

export default KioskPage
