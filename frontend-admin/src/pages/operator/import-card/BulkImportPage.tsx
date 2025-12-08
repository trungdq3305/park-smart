/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  Card,
  Table,
  Input,
  Button,
  Tag,
  Statistic,
  notification as antdNotification,
  Modal,
} from 'antd'
import type { TableColumnsType } from 'antd'
import {
  SaveOutlined,
  DeleteOutlined,
  ClearOutlined,
  QrcodeOutlined,
  SoundOutlined,
} from '@ant-design/icons'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'
import Success from '../../../assets/success.mp3'
import Cookies from 'js-cookie'
// ==================== CONSTANTS ====================
const CONFIG = {
  PYTHON_SOCKET_URL: localStorage.getItem('PARKING_PYTHON_GATEWAY_URL'),
  NEST_API: import.meta.env.VITE_API_ENDPOINT || 'http://localhost:5000/guest-cards',
  CURRENT_PARKING_ID: Cookies.get('parkingLotId') || '',
  AUTH_TOKEN: Cookies.get('userToken') || '',
} as const

const DEFAULT_VALUES = {
  PREFIX: 'CARD',
  COUNTER: 1,
} as const

// ==================== TYPES ====================
interface ScannedCardItem {
  nfcUid: string
  code: string
}

interface SocketNfcData {
  identifier: string
  [key: string]: any
}

interface BulkImportResult {
  successCount: number
  failureCount: number
  failures?: Array<{ nfcUid: string; reason: string }>
}

// ==================== UTILITY FUNCTIONS ====================
const generateCardCode = (prefix: string, index: number): string => {
  return `${prefix}_${String(index).padStart(3, '0')}`
}

const createBulkImportPayload = (parkingLotId: string, cards: ScannedCardItem[]) => ({
  parkingLotId,
  cards: cards.map((item) => ({
    nfcUid: item.nfcUid,
    code: item.code,
  })),
})

// ==================== CUSTOM HOOKS ====================
const useAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    audioRef.current = new Audio(Success)
    audioRef.current.load()
  }, [])

  const enable = useCallback(async () => {
    if (!audioRef.current) return false

    try {
      audioRef.current.volume = 0.1
      await audioRef.current.play()
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.volume = 1.0
      setIsEnabled(true)
      return true
    } catch (error) {
      console.error('Lỗi mở khóa audio:', error)
      return false
    }
  }, [])

  const play = useCallback(() => {
    if (audioRef.current && isEnabled) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((e) => console.error('Lỗi phát tiếng:', e))
    }
  }, [isEnabled])

  return { enable, play, isEnabled }
}

const useSocketConnection = (onNfcScanned: (uid: string) => void, isAudioEnabled: boolean) => {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    socketRef.current = io(CONFIG.PYTHON_SOCKET_URL, {
      transports: ['websocket'],
    })

    socketRef.current.on('connect', () => setIsConnected(true))
    socketRef.current.on('disconnect', () => setIsConnected(false))
    socketRef.current.on('nfc_scanned', (data: ScannedCardItem) => {
      onNfcScanned(data.nfcUid)
      console.log(data)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [onNfcScanned, isAudioEnabled])

  return { isConnected }
}

// ==================== API SERVICE ====================
const bulkImportService = {
  save: async (cards: ScannedCardItem[]): Promise<BulkImportResult> => {
    const payload = createBulkImportPayload(CONFIG.CURRENT_PARKING_ID, cards)
    const response = await axios.post(`${CONFIG.NEST_API}/parking/guest-cards/bulk`, payload, {
      headers: { Authorization: `Bearer ${CONFIG.AUTH_TOKEN}` },
    })
    return response.data.data[0]
  },
}

// ==================== COMPONENTS ====================
interface WelcomeModalProps {
  open: boolean
  onEnable: () => void
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ open, onEnable }) => (
  <Modal
    title="Sẵn sàng kết nối"
    open={open}
    closable={false}
    maskClosable={false}
    centered
    footer={[
      <Button key="start" type="primary" size="large" icon={<SoundOutlined />} onClick={onEnable}>
        BẮT ĐẦU QUÉT THẺ
      </Button>,
    ]}
  >
    <p>Nhấn nút bên dưới để kích hoạt hệ thống âm thanh và bắt đầu phiên làm việc.</p>
  </Modal>
)

interface ControlPanelProps {
  prefix: string
  counter: number
  cardCount: number
  onPrefixChange: (value: string) => void
  onCounterChange: (value: number) => void
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  prefix,
  counter,
  cardCount,
  onPrefixChange,
  onCounterChange,
}) => (
  <div
    style={{
      display: 'flex',
      gap: 10,
      marginBottom: 20,
      padding: 15,
      background: '#fafafa',
      border: '1px solid #eee',
    }}
  >
    <Input
      addonBefore="Tiền tố"
      value={prefix}
      onChange={(e) => onPrefixChange(e.target.value)}
      style={{ width: 150 }}
    />
    <Input
      type="number"
      addonBefore="Bắt đầu từ"
      value={counter}
      onChange={(e) => onCounterChange(Number(e.target.value))}
      style={{ width: 150 }}
    />
    <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
      <Statistic title="Số lượng thẻ" value={cardCount} valueStyle={{ fontSize: 18 }} />
    </div>
  </div>
)

// ==================== MAIN COMPONENT ====================
const BulkImportPage: React.FC = () => {
  const [scannedCards, setScannedCards] = useState<ScannedCardItem[]>([])
  const [prefix, setPrefix] = useState<string>(DEFAULT_VALUES.PREFIX)
  const [counter, setCounter] = useState<number>(DEFAULT_VALUES.COUNTER)
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(true)

  const scannedCardsRef = useRef<ScannedCardItem[]>([])
  const [api, contextHolder] = antdNotification.useNotification()
  const { enable: enableAudio, play: playBeep, isEnabled: isAudioEnabled } = useAudio()

  // Đồng bộ ref với state
  useEffect(() => {
    scannedCardsRef.current = scannedCards
  }, [scannedCards])

  // Xử lý mở khóa âm thanh
  const handleEnableAudio = useCallback(async () => {
    const success = await enableAudio()
    setShowWelcomeModal(false)

    if (success) {
      api.success({ message: 'Hệ thống đã sẵn sàng!' })
    } else {
      api.warning({
        message: 'Chưa mở khóa được âm thanh (Trình duyệt chặn)',
      })
    }
  }, [enableAudio, api])

  // Xử lý khi quét thẻ NFC
  const handleNfcScanned = useCallback(
    (uid: string) => {
      // Kiểm tra trùng lặp
      const isDuplicate = scannedCardsRef.current.some((c) => c.nfcUid === uid)
      if (isDuplicate) {
        api.warning({
          message: 'Thẻ này vừa quét rồi!',
          description: `UID: ${uid}`,
          placement: 'topRight',
          duration: 2,
        })
        return
      }

      // Phát âm thanh và thêm thẻ mới
      playBeep()

      const currentLength = scannedCardsRef.current.length
      const newIndex = currentLength + counter
      const codeName = generateCardCode(prefix, newIndex)

      api.success({
        message: 'Đã quét thẻ mới',
        description: `${codeName}`,
        placement: 'bottomRight',
        duration: 1.5,
      })

      setScannedCards((prev) => [{ nfcUid: uid, code: codeName }, ...prev])
    },
    [prefix, counter, playBeep, api]
  )

  // Kết nối socket
  const { isConnected } = useSocketConnection(handleNfcScanned, isAudioEnabled)

  // Xử lý lưu dữ liệu
  const handleSave = useCallback(async () => {
    if (scannedCards.length === 0) return

    try {
      const result = await bulkImportService.save(scannedCards)

      if (result.failureCount > 0) {
        api.warning({
          message: `Hoàn tất một phần`,
          description: `Thành công: ${result.successCount}. Thất bại: ${result.failureCount}. Xem console để biết chi tiết lỗi.`,
          duration: 5,
        })
        console.table(result.failures)
      } else {
        api.success({
          message: `Nhập kho thành công toàn bộ ${result.successCount} thẻ!`,
        })
      }

      setScannedCards([])
    } catch (err: any) {
      api.error({
        message: 'Lỗi hệ thống',
        description: err.response?.data?.message || 'Không thể kết nối Server',
      })
    }
  }, [scannedCards, api])

  // Xử lý xóa thẻ
  const handleDeleteCard = useCallback((nfcUid: string) => {
    setScannedCards((prev) => prev.filter((c) => c.nfcUid !== nfcUid))
  }, [])

  // Xử lý xóa hết
  const handleClearAll = useCallback(() => {
    setScannedCards([])
  }, [])

  // Định nghĩa columns cho table
  const columns: TableColumnsType<ScannedCardItem> = [
    {
      title: 'STT',
      render: (_, __, i) => scannedCards.length - i,
      width: 60,
    },
    {
      title: 'UID (Chip)',
      dataIndex: 'nfcUid',
      render: (t: string) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: 'Mã định danh',
      dataIndex: 'code',
      render: (t: string) => <b>{t}</b>,
    },
    {
      title: 'Xóa',
      render: (_, record) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteCard(record.nfcUid)}
        />
      ),
    },
  ]

  return (
    <div style={{ padding: 20, background: '#f0f2f5', minHeight: '100vh' }}>
      {contextHolder}

      <WelcomeModal open={showWelcomeModal} onEnable={handleEnableAudio} />

      <Card
        title={
          <span>
            <QrcodeOutlined /> Nhập Kho Thẻ Hàng Loạt
          </span>
        }
        extra={
          isConnected ? <Tag color="success">Scanner Online</Tag> : <Tag color="error">Offline</Tag>
        }
      >
        <ControlPanel
          prefix={prefix}
          counter={counter}
          cardCount={scannedCards.length}
          onPrefixChange={setPrefix}
          onCounterChange={setCounter}
        />

        <Table
          dataSource={scannedCards}
          columns={columns}
          rowKey="nfcUid"
          pagination={{ pageSize: 10 }}
          size="small"
        />

        <div
          style={{
            marginTop: 20,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <Button icon={<ClearOutlined />} onClick={handleClearAll}>
            Xóa hết
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            size="large"
            onClick={handleSave}
            disabled={scannedCards.length === 0}
          >
            Lưu vào Database
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default BulkImportPage
