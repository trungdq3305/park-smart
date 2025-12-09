/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react'
import {
  Card,
  Button,
  Input,
  Row,
  Col,
  Statistic,
  Descriptions,
  Typography,
  notification as antdNotification,
  Space,
  Badge,
  Divider,
  Select,
  Tag,
} from 'antd'
import { io, Socket } from 'socket.io-client'
import {
  VideoCameraOutlined,
  CameraOutlined,
  CarOutlined,
  ScanOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CloseCircleOutlined,
  HourglassOutlined,
  EditOutlined,
} from '@ant-design/icons'
import Cookies from 'js-cookie'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

import Success from '../../../assets/success.mp3'
import { useLocalGateway } from '../../../hooks/useLocalGateway'
import SettingsModal from '../../../components/SettingsModal'
import './KioskPage.css'

import {
  useCheckInMutation,
  useCalculateCheckoutFeeMutation,
  useConfirmCheckoutMutation,
  useLazyCheckSessionStatusQuery,
  useGetActivePricingPoliciesQuery,
} from '../../../features/operator/parkingSessionAPI'
import axios from 'axios'

dayjs.extend(duration)

const { Title, Text } = Typography

const CURRENT_PARKING_ID = Cookies.get('parkingLotId') || ''

interface ScanData {
  identifier?: string
  plateNumber?: string
  image?: string
  timestamp?: number
  type?: string
  nfcUid?: string
}

const KioskPage: React.FC = () => {
  const { gatewayUrl, saveGatewayUrl } = useLocalGateway()
  const LIVE_STREAM_URL = `${gatewayUrl}/video_feed`

  const [checkIn] = useCheckInMutation()
  const [calculateCheckoutFee] = useCalculateCheckoutFeeMutation()
  const [confirmCheckout] = useConfirmCheckoutMutation()
  const [triggerStatusCheck] = useLazyCheckSessionStatusQuery()

  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const [checkInImage, setCheckInImage] = useState<string | null>(null)

  // API lấy danh sách bảng giá
  const { data: policies, isLoading: isLoadingPolicies } =
    useGetActivePricingPoliciesQuery(CURRENT_PARKING_ID)

  const [cardUid, setCardUid] = useState<string>('---')
  const [identifier, setIdentifier] = useState<string>('---')
  const [plateNumber, setPlateNumber] = useState<string>('')
  const [timeIn, setTimeIn] = useState<string>('---')
  const [timeOut, setTimeOut] = useState<string>('---')
  const [durationStr, setDurationStr] = useState<string>('---')
  const [customerType, setCustomerType] = useState<string>('---')
  const [parkingFee, setParkingFee] = useState<number>(0)
  const [message, setMessage] = useState<string>('Sẵn sàng quét thẻ...')

  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null)
  const [currentScanData, setCurrentScanData] = useState<any>(null)

  const [mode, setMode] = useState<'CHECK_IN' | 'CHECK_OUT' | 'IDLE'>('IDLE')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [sessionData, setSessionData] = useState<any>(null)

  // ⭐️ FIX LỖI CLOSURE: Dùng useRef để socket luôn đọc được giá trị mới nhất
  const selectedPolicyRef = useRef<string | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [api, contextHolder] = antdNotification.useNotification()

  // Sync state với ref
  useEffect(() => {
    selectedPolicyRef.current = selectedPolicyId
  }, [selectedPolicyId])

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

  const calculateDuration = (start: string | Date, end: string | Date) => {
    const startTime = dayjs(start)
    const endTime = dayjs(end)
    const diff = endTime.diff(startTime)
    const d = dayjs.duration(diff)
    const hours = Math.floor(d.asHours())
    const minutes = d.minutes()
    if (hours > 0) return `${hours} giờ ${minutes} phút`
    return `${minutes} phút`
  }

  const dataURLtoFile = (dataurl: string, filename: string) => {
    if (!dataurl) return null
    const arr = dataurl.split(',')
    const match = arr[0].match(/:(.*?);/)
    if (!match) return null
    const mime = match[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, { type: mime })
  }

  // Hàm tính phí tách riêng
  const calculateFeeAction = async (scanParams: any, policyId: string) => {
    try {
      setMessage('Đang tính toán phí...')
      const feeParams = {
        ...scanParams,
        pricingPolicyId: policyId,
      }

      const checkoutInfo = await calculateCheckoutFee({
        parkingLotId: CURRENT_PARKING_ID,
        data: feeParams,
      }).unwrap()

      setSessionData(checkoutInfo) // Lưu lại thông tin phiên để checkout

      // Lấy amount an toàn
      const finalAmount =
        checkoutInfo?.data?.[0]?.amount ?? checkoutInfo.totalAmount ?? checkoutInfo.amount ?? 0
      setParkingFee(finalAmount)

      setCustomerType(checkoutInfo.description || 'Khách vãng lai')

      api.info({
        message: 'Đã cập nhật phí',
        description: `Phí mới: ${finalAmount.toLocaleString('vi-VN')} đ`,
      })
      setMessage('Sẵn sàng thanh toán')
    } catch (error) {
      console.error(error)
      api.error({ message: 'Lỗi tính phí với chính sách này' })
    }
  }

  const handlePolicyChange = (newPolicyId: string) => {
    setSelectedPolicyId(newPolicyId)
    // Khi đổi policy bằng tay, gọi tính lại ngay nếu đang có xe
    if (currentScanData) {
      calculateFeeAction(currentScanData, newPolicyId)
    }
  }

  // --- HÀM XỬ LÝ KHI QUÉT (SOCKET) ---
  // --- XỬ LÝ KHI QUÉT (SOCKET) ---
  const handleNewScan = async (data: ScanData) => {
    playBeep()
    setIsLoading(true)

    // Cập nhật UI ảnh/biển số ngay lập tức
    if (data.image) setSnapshot(data.image)
    if (data.nfcUid) setCardUid(data.nfcUid)
    if (data.identifier) setIdentifier(data.identifier)
    if (data.plateNumber) setPlateNumber(data.plateNumber)

    try {
      // 1. Gọi API kiểm tra trạng thái
      const statusParams = {
        parkingLotId: CURRENT_PARKING_ID,
        nfcUid: data.nfcUid || undefined,
        identifier: data.identifier || undefined,
      }

      const statusRes = await triggerStatusCheck(statusParams).unwrap()
      const { state, session, images, type } = statusRes

      if (state === 'INSIDE') {
        // ===> CHẾ ĐỘ XE RA (CHECK-OUT) <===
        setMode('CHECK_OUT')

        // 1. Hiển thị NGAY LẬP TỨC thông tin thời gian & loại khách từ `session`
        // (Không cần chờ tính tiền mới hiện)
        const inTime = new Date(session.checkInTime)
        const now = new Date() // Giờ ra tạm tính là hiện tại

        setTimeIn(inTime.toLocaleString('vi-VN'))
        setTimeOut(now.toLocaleString('vi-VN'))
        setDurationStr(calculateDuration(inTime, now))
        setCustomerType(type || 'Khách vãng lai')

        // Xử lý ảnh đối chiếu
        const historyImgUrl = images?.[0]?.url || session?.imageUrl || null
        setCheckInImage(historyImgUrl)

        // 2. Chuẩn bị dữ liệu để tính tiền
        const scanParams: any = {}
        if (data.nfcUid) scanParams.nfcUid = data.nfcUid
        if (data.identifier) scanParams.identifier = data.identifier
        setCurrentScanData(scanParams)

        // 3. Kiểm tra Policy và Tính tiền
        const currentPolicyId = selectedPolicyRef.current

        if (currentPolicyId) {
          setMessage('Xe ra - Đang tính phí...')
          // Gọi hàm tính tiền (Hàm này sẽ update lại Phí sau khi chạy xong)
          await calculateFeeAction(scanParams, currentPolicyId)
        } else {
          setMessage('Vui lòng chọn bảng giá!')
          api.warning({
            message: 'Chưa chọn bảng giá',
            description: 'Vui lòng chọn bảng giá áp dụng ở danh sách bên phải.',
            duration: 4,
          })
          setParkingFee(0)
          setSessionData(null) // Chặn nút bấm
        }
      } else {
        // ===> CHẾ ĐỘ XE VÀO (CHECK-IN) <===
        setMode('CHECK_IN')
        setMessage('Xe vào - Xác nhận biển số')

        setTimeIn(new Date().toLocaleString('vi-VN'))
        setTimeOut('---')
        setDurationStr('---')
        setParkingFee(0)
        setCustomerType(type)
        setSessionData(null)
        setCurrentScanData(null)

        api.success({
          message: 'Xe vào',
          description: 'Vui lòng xác nhận biển số',
        })
      }
    } catch (error: any) {
      console.error(error)
      api.error({ message: error.data?.message || 'Lỗi không xác định' })
      setMode('IDLE')
    } finally {
      setIsLoading(false)
    }
  }

  // Đăng ký Socket với handleNewScan
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
  // Lưu ý: Dependency array để trống hoặc chỉ gatewayUrl là đúng,
  // vì ta dùng Ref để access state mới nhất bên trong handleNewScan.

  const handleMainAction = async () => {
    if (mode === 'IDLE') return

    setIsLoading(true)

    try {
      if (mode === 'CHECK_IN') {
        // ... (Logic Check In giữ nguyên)
        if (!snapshot) {
          api.error({
            message: 'Thiếu hình ảnh!',
            description: 'Vui lòng chờ camera chụp ảnh biển số.',
          })
          setIsLoading(false)
          return
        }

        const formData = new FormData()
        if (plateNumber) formData.append('plateNumber', plateNumber)
        if (cardUid && cardUid !== '---') formData.append('nfcUid', cardUid)
        if (identifier && identifier !== '---') formData.append('identifier', identifier)
        formData.append('description', 'Check-in từ Kiosk Bảo Vệ')

        const imageFile = dataURLtoFile(snapshot, 'checkin-snapshot.jpg')
        if (imageFile) formData.append('file', imageFile)
        else throw new Error('Lỗi xử lý file ảnh')

        await checkIn({ parkingLotId: CURRENT_PARKING_ID, formData }).unwrap()
        await axios.post(`${gatewayUrl}/confirm-checkin`)
        api.success({ message: 'Check-in thành công!', description: 'Đã mở barrier.' })
      } else {
        // ===> XỬ LÝ CHECK-OUT <===

        // 1. Kiểm tra điều kiện
        if (!selectedPolicyId || !sessionData) {
          api.error({ message: 'Vui lòng chọn bảng giá và đợi tính phí xong!' })
          setIsLoading(false)
          return
        }

        if (!snapshot) {
          api.error({ message: 'Thiếu hình ảnh xe ra!' })
          setIsLoading(false)
          return
        }

        // 2. Lấy Session ID an toàn
        // Kiểm tra cấu trúc trả về từ API calculate
        const sessionId =
          sessionData.data?.[0]?.sessionId || sessionData.sessionId || sessionData._id
        if (!sessionId) {
          throw new Error('Không tìm thấy Session ID hợp lệ để thanh toán')
        }

        // 3. Tạo FormData
        const formData = new FormData()
        if (sessionData.paymentId) formData.append('paymentId', sessionData.paymentId)

        formData.append('pricingPolicyId', selectedPolicyId)
        formData.append('amountPayAfterCheckOut', parkingFee.toString())

        const imageFile = dataURLtoFile(snapshot, 'checkout-snapshot.jpg')
        if (imageFile) formData.append('file', imageFile)
        else throw new Error('Lỗi xử lý file ảnh check-out')

        // 4. Gọi API Confirm
        await confirmCheckout({
          sessionId: sessionId,
          formData: formData,
        }).unwrap()

        api.success({ message: 'Thanh toán xong. Mở cổng ra!' })
        await axios.post(`${gatewayUrl}/confirm-checkout`)
      }

      // Reset States (Giữ lại selectedPolicyId)
      setMode('IDLE')
      setSnapshot(null)
      setPlateNumber('')
      setCardUid('---')
      setIdentifier('---')
      setCheckInImage(null)
      setSessionData(null)
      setDurationStr('---')
      setMessage('Sẵn sàng quét thẻ...')
      setCurrentScanData(null)
    } catch (error: any) {
      console.error('Lỗi thao tác:', error)
      api.error({
        message: 'Thao tác thất bại',
        description: error?.data?.message || error?.message || 'Lỗi Server không xác định',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setMode('IDLE')
    setSnapshot(null)
    setCheckInImage(null)
    setSessionData(null)
    setDurationStr('---')
    setCurrentScanData(null)
    setMessage('Đã hủy bỏ. Sẵn sàng quét mới.')
  }

  const handleOpenBarier = async () => {
    try {
      await axios.post(`${gatewayUrl}/confirm-checkin`)
      api.success({ message: 'Đã gửi lệnh mở cổng' })
    } catch (error: any) {
      api.error({ message: 'Lỗi mở barrier' })
    }
  }

  return (
    <div className="kiosk-layout">
      {contextHolder}
      <SettingsModal currentUrl={gatewayUrl} onSave={saveGatewayUrl} />

      <header className="kiosk-header">
        {/* ... Header content giữ nguyên ... */}
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
          <Col span={16} style={{ height: '100%' }}>
            <div className="kiosk-left-column">
              <div className="kiosk-camera-wrapper">
                <Card
                  title={
                    <Space>
                      <VideoCameraOutlined className="kiosk-card-title-icon" />
                      <Text strong className="kiosk-card-title">
                        Camera Giám Sát
                      </Text>
                    </Space>
                  }
                  className="kiosk-card-container"
                  styles={{
                    body: {
                      flex: 1,
                      padding: 0,
                      background: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    },
                  }}
                >
                  <img
                    src={LIVE_STREAM_URL}
                    className="kiosk-image-display"
                    alt="Live Stream"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      if (target.parentElement)
                        target.parentElement.innerHTML =
                          '<div style="color: #666;">Đang kết nối camera...</div>'
                    }}
                  />
                </Card>
              </div>
              <div className="kiosk-bottom-row">
                <Card
                  title={
                    <Space>
                      <CameraOutlined className="kiosk-card-title-icon" />
                      <Text strong className="kiosk-card-title">
                        {mode === 'CHECK_OUT' ? 'Ảnh Ra (Hiện tại)' : 'Ảnh Chụp Tức Thời'}
                      </Text>
                    </Space>
                  }
                  className="kiosk-card-container"
                  style={{ flex: 1 }}
                  styles={{
                    body: {
                      flex: 1,
                      padding: 0,
                      background: '#1a1a1a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    },
                  }}
                >
                  {snapshot ? (
                    <img src={snapshot} className="kiosk-image-display" alt="Snapshot" />
                  ) : (
                    <div className="kiosk-placeholder">
                      <CameraOutlined className="kiosk-placeholder-icon" />
                      <Text style={{ color: '#8c8c8c' }}>Chờ tín hiệu...</Text>
                    </div>
                  )}
                </Card>
                {mode === 'CHECK_OUT' && (
                  <Card
                    title={
                      <Space>
                        <ClockCircleOutlined className="kiosk-card-title-icon" />
                        <Text strong className="kiosk-card-title">
                          Ảnh Vào (Đối chiếu)
                        </Text>
                      </Space>
                    }
                    className="kiosk-card-container"
                    style={{ flex: 1, borderColor: '#1890ff' }}
                    styles={{
                      body: {
                        flex: 1,
                        padding: 0,
                        background: '#1a1a1a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      },
                    }}
                  >
                    {checkInImage ? (
                      <img
                        src={checkInImage}
                        className="kiosk-image-display"
                        alt="Check-in Evidence"
                      />
                    ) : (
                      <div className="kiosk-placeholder">
                        <div style={{ color: '#999' }}>Không có ảnh</div>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </div>
          </Col>

          <Col span={8}>
            <Card
              title={
                <Text strong className="kiosk-transaction-title">
                  THÔNG TIN GIAO DỊCH
                </Text>
              }
              className="kiosk-transaction-card"
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 24 } }}
            >
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: 'block', marginBottom: 6, color: '#595959' }}>
                  Bảng giá áp dụng: <span style={{ color: 'red' }}>*</span>
                </Text>
                <Select
                  style={{ width: '100%' }}
                  size="large"
                  value={selectedPolicyId}
                  onChange={handlePolicyChange}
                  loading={isLoadingPolicies}
                  placeholder="-- Chọn bảng giá --"
                  allowClear
                  status={mode === 'CHECK_OUT' && !selectedPolicyId ? 'error' : ''}
                  optionLabelProp="label"
                >
                  {policies?.map((item: any) => (
                    <Select.Option
                      key={item.pricingPolicyId._id}
                      value={item.pricingPolicyId._id}
                      label={item.pricingPolicyId.name}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px', lineHeight: '1.2' }}>
                          {item.pricingPolicyId.name}
                        </span>
                        {item.pricingPolicyId.basisId?.description && (
                          <span style={{ color: '#8c8c8c', fontSize: '12px', marginTop: '2px' }}>
                            {item.pricingPolicyId.basisId.description}
                          </span>
                        )}
                      </div>
                    </Select.Option>
                  ))}
                </Select>
                {mode === 'CHECK_OUT' && !selectedPolicyId && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    Vui lòng chọn bảng giá để tính tiền
                  </Text>
                )}
              </div>

              <Divider style={{ margin: '10px 0 20px 0' }} />

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
                    {cardUid || identifier}
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
                  <>
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
                    <Descriptions.Item
                      label={
                        <Space>
                          <HourglassOutlined />
                          <span>Thời Gian Đỗ</span>
                        </Space>
                      }
                    >
                      <Text strong className="kiosk-descriptions-text-small">
                        {durationStr}
                      </Text>
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>

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
                <Button
                  block
                  size="large"
                  icon={<CarOutlined className="kiosk-open-barrier-icon" />}
                  onClick={handleOpenBarier}
                  className="kiosk-open-barrier-button"
                >
                  MỞ CỔNG BARRIER THỦ CÔNG
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
