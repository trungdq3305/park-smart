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
  Select, // 👈 Thêm Select
  Spin,
} from 'antd'
import { io, Socket } from 'socket.io-client'
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
import Cookies from 'js-cookie'

import Success from '../../../assets/success.mp3'
import { useLocalGateway } from '../../../hooks/useLocalGateway'
import SettingsModal from '../../../components/SettingsModal'
import './KioskPage.css'

// 👇 IMPORT API HOOKS TỪ FILE BẠN ĐÃ TẠO
// (Hãy chỉnh sửa đường dẫn này nếu file API của bạn nằm ở chỗ khác)
import {
  useCheckInMutation,
  useCalculateCheckoutFeeMutation,
  useConfirmCheckoutMutation,
  useLazyCheckSessionStatusQuery,
  useGetActivePricingPoliciesQuery,
} from '../../../features/operator/parkingSessionAPI'
import axios from 'axios'

const { Title, Text } = Typography

const CURRENT_PARKING_ID = Cookies.get('parkingLotId') || '' // ID bãi xe hiện tại

interface ScanData {
  identifier?: string
  plateNumber?: string
  image?: string
  timestamp?: number
  type?: string
  nfcUid?: string
}

const KioskPage: React.FC = () => {
  // Hook quản lý Gateway URL
  const { gatewayUrl, saveGatewayUrl } = useLocalGateway()
  const LIVE_STREAM_URL = `${gatewayUrl}/video_feed`

  // --- RTK QUERY HOOKS ---
  const [checkIn] = useCheckInMutation()
  const [calculateCheckoutFee] = useCalculateCheckoutFeeMutation()
  const [confirmCheckout] = useConfirmCheckoutMutation()
  // Dùng Lazy Query vì ta gọi API này khi có sự kiện quét, không phải lúc mount
  const [triggerStatusCheck] = useLazyCheckSessionStatusQuery()

  // State
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const [checkInImage, setCheckInImage] = useState<string | null>(null)
  const { data: policies, isLoading: isLoadingPolicies } =
    useGetActivePricingPoliciesQuery(CURRENT_PARKING_ID)

  // Data hiển thị
  const [cardUid, setCardUid] = useState<string>('---')
  const [identifier, setIdentifier] = useState<string>('---')
  const [plateNumber, setPlateNumber] = useState<string>('')
  const [timeIn, setTimeIn] = useState<string>('---')
  const [timeOut, setTimeOut] = useState<string>('---')
  const [customerType, setCustomerType] = useState<string>('---')
  const [parkingFee, setParkingFee] = useState<number>(0)
  const [message, setMessage] = useState<string>('Sẵn sàng quét thẻ...')
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null)
  const [currentScanData, setCurrentScanData] = useState<any>(null)
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

  // Hàm helper convert base64 sang File
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

  const calculateFeeAction = async (scanParams: any, policyId: string) => {
    try {
      setMessage('Đang tính toán phí...')
      const feeParams = {
        ...scanParams,
        pricingPolicyId: policyId, // Dùng policy được chọn
      }

      const checkoutInfo = await calculateCheckoutFee({
        parkingLotId: CURRENT_PARKING_ID,
        data: feeParams,
      }).unwrap()

      setSessionData(checkoutInfo)

      // Update UI
      setTimeIn(new Date(checkoutInfo.checkInTime).toLocaleString('vi-VN'))
      setTimeOut(new Date(checkoutInfo.checkOutTime).toLocaleString('vi-VN'))
      setParkingFee(checkoutInfo.totalAmount)
      setCustomerType(checkoutInfo.description || 'Khách vãng lai')

      const amountDisplay = checkoutInfo?.data?.[0]?.amount ?? checkoutInfo.totalAmount ?? 0

      api.info({
        message: 'Đã cập nhật phí',
        description: `Phí mới: ${amountDisplay.toLocaleString('vi-VN')} đ`,
      })
      setMessage('Sẵn sàng thanh toán')
    } catch (error) {
      console.error(error)
      api.error({ message: 'Lỗi tính phí với chính sách này' })
    }
  }

  // ⭐️ SỰ KIỆN: Khi người dùng chọn chính sách khác trong Dropdown
  const handlePolicyChange = (newPolicyId: string) => {
    setSelectedPolicyId(newPolicyId)
    if (currentScanData) {
      // Tính lại tiền ngay lập tức với Policy mới
      calculateFeeAction(currentScanData, newPolicyId)
    }
  }

  // --- XỬ LÝ KHI QUÉT THẺ / BIỂN SỐ ---
  const handleNewScan = async (data: ScanData) => {
    playBeep()
    setIsLoading(true)

    // 1. Cập nhật UI cơ bản từ Socket
    if (data.image) setSnapshot(data.image)
    if (data.nfcUid) setCardUid(data.nfcUid)
    if (data.identifier) setIdentifier(data.identifier)
    if (data.plateNumber) setPlateNumber(data.plateNumber)

    try {
      // 2. GỌI API STATUS CHECK
      const statusParams = {
        parkingLotId: CURRENT_PARKING_ID,
        nfcUid: data.nfcUid || undefined,
        identifier: data.identifier || undefined,
      }

      const statusRes = await triggerStatusCheck(statusParams).unwrap()
      const { state, session, images, type } = statusRes

      if (state === 'INSIDE') {
        // ===> CHẾ ĐỘ CHECK-OUT (XE RA) <===
        setMode('CHECK_OUT')

        // 1. Lưu thông tin quét để dùng tính tiền sau khi chọn Policy
        const scanParams: any = {}
        if (data.nfcUid) scanParams.nfcUid = data.nfcUid
        if (data.identifier) scanParams.identifier = data.identifier
        setCurrentScanData(scanParams)

        // 2. Xử lý ảnh đối chiếu
        const historyImgUrl = images?.[0]?.url || session?.imageUrl || null
        setCheckInImage(historyImgUrl)

        // 3. LOGIC CHỌN BẢNG GIÁ
        if (selectedPolicyId) {
          // Nếu bảo vệ ĐÃ chọn bảng giá từ trước -> Tính tiền ngay
          setMessage('Xe ra - Đang tính phí...')
          await calculateFeeAction(scanParams, selectedPolicyId)
        } else {
          // Nếu CHƯA chọn -> Nhắc nhở & Reset hiển thị tiền
          setMessage('Vui lòng chọn bảng giá!')
          api.warning({
            message: 'Chưa chọn bảng giá',
            description: 'Vui lòng chọn bảng giá áp dụng ở danh sách bên phải.',
            duration: 4,
          })

          setParkingFee(0)
          // Hiển thị giờ nhưng chưa có tiền
          setTimeIn(new Date(session.checkInTime).toLocaleString('vi-VN'))
          setTimeOut(new Date().toLocaleString('vi-VN'))
          setCustomerType(type || '---')
          // Xóa sessionData cũ để nút bấm không hoạt động
          setSessionData(null)
        }
      } else {
        // ===> CHẾ ĐỘ CHECK-IN (XE VÀO) <===
        setMode('CHECK_IN')
        setMessage('Xe vào - Xác nhận biển số')

        // Reset các trường cũ
        setTimeIn(new Date().toLocaleString('vi-VN'))
        setTimeOut('---')
        setParkingFee(0)
        setCustomerType(type)
        setSessionData(null)
        // Lưu ý: Không reset selectedPolicyId để giữ lựa chọn cho xe sau
        setCurrentScanData(null)

        api.success({
          message: 'Xe vào',
          description: 'Vui lòng xác nhận biển số',
        })
      }
    } catch (error: any) {
      console.error(error)
      api.error({ message: 'Lỗi hoặc không tìm thấy thông tin xe' })
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
        // ===> XỬ LÝ CHECK-IN <===

        // Kiểm tra dữ liệu bắt buộc
        if (!snapshot) {
          api.error({
            message: 'Thiếu hình ảnh!',
            description: 'Vui lòng chờ camera chụp ảnh biển số.',
          })
          setIsLoading(false)
          return
        }

        // Tạo FormData
        const formData = new FormData()

        // Thêm các trường text
        if (plateNumber) formData.append('plateNumber', plateNumber)

        if (cardUid && cardUid !== '---') {
          formData.append('nfcUid', cardUid)
        }
        if (identifier && identifier !== '---') {
          formData.append('identifier', identifier)
        }

        formData.append('description', 'Check-in tại cổng Kiosk 1')

        // Chuyển đổi ảnh snapshot (Base64) thành File
        const imageFile = dataURLtoFile(snapshot, 'checkin-snapshot.jpg')
        if (imageFile) {
          formData.append('file', imageFile)
        } else {
          throw new Error('Lỗi xử lý file ảnh')
        }

        // Gọi API Check-in (Mutation)
        await checkIn({
          parkingLotId: CURRENT_PARKING_ID,
          formData: formData,
        }).unwrap()
        await axios.post(`${gatewayUrl}/confirm-checkin`)
        api.success({ message: 'Check-in thành công!', description: 'Đã mở barrier.' })
      } else {
        // ===> XỬ LÝ CHECK-OUT (CONFIRM) <===

        // 🔴 THÊM ĐOẠN NÀY: Chặn nếu chưa chọn bảng giá hoặc chưa có dữ liệu tính phí
        if (!selectedPolicyId || !sessionData) {
          api.error({ message: 'Vui lòng chọn bảng giá để tính tiền trước khi cho xe ra!' })
          setIsLoading(false)
          return
        }

        // 1. Kiểm tra ảnh (giữ nguyên)
        if (!snapshot) {
          api.error({ message: 'Thiếu hình ảnh xe ra!' })
          setIsLoading(false)
          return
        }

        // 2. Tạo FormData
        const formData = new FormData()

        // Thêm paymentId (nếu có)
        if (sessionData.paymentId) {
          formData.append('paymentId', sessionData.paymentId)
        }

        // 🔴 SỬA ĐOẠN NÀY: Dùng selectedPolicyId chắc chắn hơn sessionData
        formData.append('pricingPolicyId', selectedPolicyId)

        // 3. Chuyển đổi ảnh snapshot sang File
        const imageFile = dataURLtoFile(snapshot, 'checkout-snapshot.jpg')
        if (imageFile) {
          formData.append('file', imageFile)
        } else {
          throw new Error('Lỗi xử lý file ảnh check-out')
        }

        // 4. Gọi API
        await confirmCheckout({
          sessionId: sessionData.data[0].sessionId, // Hoặc sessionData.sessionId tùy cấu trúc trả về
          formData: formData, // 👈 Gửi cục FormData này đi
        }).unwrap()

        api.success({ message: 'Thanh toán xong. Mở cổng ra!' })
        await axios.post(`${gatewayUrl}/confirm-checkout`)
      }

      // Reset về trạng thái chờ sau khi xong
      setMode('IDLE')
      setSnapshot(null)
      setPlateNumber('')
      setCardUid('---')
      setIdentifier('---')
      setCheckInImage(null) // Xóa ảnh đối chiếu cũ
      setSessionData(null) // Xóa dữ liệu phiên cũ
      setMessage('Sẵn sàng quét thẻ...')
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

  // Cancel
  const handleCancel = () => {
    setMode('IDLE')
    setSnapshot(null)
    setMessage('Đã hủy bỏ. Sẵn sàng quét mới.')
  }

  const handleOpenBarier = async () => {
    try {
      await axios.post(`${gatewayUrl}/confirm-checkin`)
    } catch (error: any) {
      console.error('Lỗi mở barrier:', error)
      api.error({
        message: 'Lỗi mở barrier',
        description: error?.response?.data?.message || 'Không thể mở barrier',
      })
    }
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
          <Col span={16} style={{ height: '100%' }}>
            <div className="kiosk-left-column">
              {/* 1. Live Stream (Flex 6) */}
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
                  // Ghi đè style body của Antd để full chiều cao
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
                      if (target.parentElement) {
                        target.parentElement.innerHTML =
                          '<div style="color: #666;">Đang kết nối camera...</div>'
                      }
                    }}
                  />
                </Card>
              </div>

              {/* 2. Khu vực Ảnh chụp dưới (Flex 4) */}
              <div className="kiosk-bottom-row">
                {/* Ảnh chụp hiện tại (Snapshot) */}
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
                  style={{ flex: 1 }} // Chia đều 50-50
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

                {/* Ảnh Lịch sử (Chỉ hiện khi Check-out) */}
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
                  // 👇 QUAN TRỌNG: Thêm dòng này để chỉ hiện Tên (label) khi đã chọn
                  optionLabelProp="label"
                >
                  {policies?.map((item: any) => (
                    <Select.Option
                      key={item.pricingPolicyId._id}
                      value={item.pricingPolicyId._id}
                      // 👇 Giá trị này sẽ được hiện lên ô Input khi chọn
                      label={item.pricingPolicyId.name}
                    >
                      {/* 👇 Giao diện chi tiết này chỉ hiện trong danh sách xổ xuống */}
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
                {/* Dòng nhắc nhở nhỏ */}
                {mode === 'CHECK_OUT' && !selectedPolicyId && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    Vui lòng chọn bảng giá để tính tiền
                  </Text>
                )}
              </div>

              <Divider style={{ margin: '10px 0 20px 0' }} />
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
