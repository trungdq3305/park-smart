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
  Layout,
  Typography,
  notification as antdNotification,
  Space,
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
} from '@ant-design/icons'

import Success from '../assets/success.mp3'

const { Header, Content } = Layout
const { Title } = Typography

const PYTHON_URL = 'http://PhamVietHoang:1836'
const LIVE_STREAM_URL = `${PYTHON_URL}/video_feed`
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
  const [message, setMessage] = useState<string>('Sẵn sàng...')

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

      const { state, session } = statusRes.data

      if (state === 'INSIDE') {
        // ===> CHẾ ĐỘ CHECK-OUT (XE RA) <===
        setMode('CHECK_OUT')
        setMessage('Phát hiện xe ra. Đang tính tiền...')

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
        setTimeIn(new Date(checkoutInfo.checkInTime).toLocaleString())
        setTimeOut(new Date(checkoutInfo.checkOutTime).toLocaleString())
        setParkingFee(checkoutInfo.totalAmount)
        setCustomerType(checkoutInfo.description || 'Khách vãng lai')

        api.info({
          message: 'Xe ra',
          description: `Phí: ${checkoutInfo.totalAmount.toLocaleString()} đ`,
        })
      } else {
        // ===> CHẾ ĐỘ CHECK-IN (XE VÀO) <===
        setMode('CHECK_IN')
        setMessage('Phát hiện xe vào. Sẵn sàng check-in.')

        // Reset các trường cũ
        setTimeIn(new Date().toLocaleString())
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
    socketRef.current = io(PYTHON_URL, { transports: ['websocket'] })

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
  }, [])

  // --- HÀM XỬ LÝ NÚT BẤM ---
  const handleMainAction = async () => {
    if (mode === 'IDLE') return
    setIsLoading(true)

    try {
      if (mode === 'CHECK_IN') {
        // Gọi API Check-in
        // Lưu ý: Gửi kèm file ảnh nếu có (ở đây giả lập chưa gửi file để code gọn)
        await axios.post(`${NEST_API_BASE}/parking-lot-sessions/check-in/${CURRENT_PARKING_ID}`, {
          plateNumber: plateNumber,
          identifier: cardUid,
          // nfcUid: ... nếu có
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
    <Layout style={{ height: '100vh', background: '#141414' }}>
      {contextHolder}

      {/* Header giữ nguyên */}
      <Header
        style={{
          background: '#001529',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 20px',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <img src="/vite.svg" alt="Logo" style={{ height: 30 }} />
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            KIOSK BẢO VỆ
          </Title>
        </div>
        <Space>
          {isConnected ? <Tag color="success">ONLINE</Tag> : <Tag color="error">OFFLINE</Tag>}
          <Tag color="blue">CỔNG SỐ 1</Tag>
        </Space>
      </Header>

      <Content style={{ padding: '10px' }}>
        <Row gutter={[10, 10]} style={{ height: '100%' }}>
          {/* Cột trái: Camera */}
          <Col span={16} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Card
              title={
                <span>
                  <VideoCameraOutlined /> Camera
                </span>
              }
              bodyStyle={{
                padding: 0,
                background: '#000',
                height: '45vh',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <img
                src={LIVE_STREAM_URL}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
                alt="Stream"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
            </Card>
            <Card
              title={
                <span>
                  <CameraOutlined /> Ảnh Chụp
                </span>
              }
              bodyStyle={{
                padding: 0,
                background: '#222',
                height: '38vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {snapshot ? (
                <img src={snapshot} style={{ maxWidth: '100%', maxHeight: '100%' }} alt="Snap" />
              ) : (
                <div style={{ color: '#666' }}>Chờ tín hiệu quét...</div>
              )}
            </Card>
          </Col>

          {/* Cột phải: Thông tin & Hành động */}
          <Col span={8}>
            <Card
              title="THÔNG TIN GIAO DỊCH"
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
              bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              {/* Trạng thái hiện tại */}
              <div
                style={{
                  marginBottom: 20,
                  padding: 15,
                  borderRadius: 8,
                  textAlign: 'center',
                  background:
                    mode === 'CHECK_IN' ? '#f6ffed' : mode === 'CHECK_OUT' ? '#fff1f0' : '#f0f0f0',
                  border:
                    mode === 'CHECK_IN'
                      ? '1px solid #b7eb8f'
                      : mode === 'CHECK_OUT'
                        ? '1px solid #ffa39e'
                        : '1px solid #d9d9d9',
                }}
              >
                <Title
                  level={4}
                  style={{
                    margin: 0,
                    color:
                      mode === 'CHECK_IN'
                        ? '#389e0d'
                        : mode === 'CHECK_OUT'
                          ? '#cf1322'
                          : '#595959',
                  }}
                >
                  {mode === 'CHECK_IN' && <LoginOutlined />}
                  {mode === 'CHECK_OUT' && <LogoutOutlined />}
                  {' ' + message}
                </Title>
              </div>

              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#888' }}>BIỂN SỐ XE</span>
                <Input
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  prefix={<CarOutlined />}
                  style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: '#1890ff',
                  }}
                  suffix={<EditOutlined />}
                />
              </div>

              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Mã Thẻ">
                  <Space>
                    <ScanOutlined /> <b>{cardUid}</b>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Loại Khách">{customerType}</Descriptions.Item>
                <Descriptions.Item label="Giờ Vào">{timeIn}</Descriptions.Item>
                <Descriptions.Item label="Giờ Ra">{timeOut}</Descriptions.Item>
              </Descriptions>

              <div
                style={{
                  marginTop: 20,
                  textAlign: 'center',
                  padding: 15,
                  background: '#fffbe6',
                  border: '1px solid #ffe58f',
                  borderRadius: 8,
                }}
              >
                <Statistic
                  title="PHÍ CẦN THU"
                  value={parkingFee}
                  suffix="VNĐ"
                  valueStyle={{
                    color: '#cf1322',
                    fontWeight: 'bold',
                    fontSize: 32,
                  }}
                  prefix={<DollarOutlined />}
                />
              </div>

              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {/* NÚT HÀNH ĐỘNG CHÍNH - THAY ĐỔI THEO CHẾ ĐỘ */}
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={mode === 'CHECK_IN' ? <LoginOutlined /> : <CheckCircleOutlined />}
                  style={{
                    height: 60,
                    fontSize: 20,
                    background:
                      mode === 'CHECK_IN'
                        ? '#389e0d'
                        : mode === 'CHECK_OUT'
                          ? '#1890ff'
                          : '#d9d9d9',
                    borderColor: 'transparent',
                  }}
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

                <Button danger block onClick={handleCancel} disabled={mode === 'IDLE'}>
                  HỦY BỎ
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  )
}

export default KioskPage
