/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  Table,
  Input,
  Button,
  Tag,
  Statistic,
  notification as antdNotification,
  Modal,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  SaveOutlined,
  DeleteOutlined,
  ClearOutlined,
  QrcodeOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { io, Socket } from "socket.io-client";
import axios from "axios";

// Import file âm thanh
import Success from "../assets/success.mp3";

// 👉 CẬP NHẬT: Dùng Hostname thay vì IP cứng
const PYTHON_SOCKET_URL = "http://PhamVietHoang:1836";
const NEST_API = "http://localhost:5000/api/guest-cards";

interface ScannedCardItem {
  nfcUid: string;
  code: string;
}

interface SocketNfcData {
  identifier: string;
  [key: string]: any;
}

const BulkImportPage: React.FC = () => {
  // State dữ liệu
  const [scannedCards, setScannedCards] = useState<ScannedCardItem[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [prefix, setPrefix] = useState<string>("CARD");
  const [counter, setCounter] = useState<number>(1);

  // State mở khóa âm thanh
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const scannedCardsRef = useRef<ScannedCardItem[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Notification Hook
  const [api, contextHolder] = antdNotification.useNotification();

  // Đồng bộ Ref
  useEffect(() => {
    scannedCardsRef.current = scannedCards;
  }, [scannedCards]);

  // Khởi tạo Audio
  useEffect(() => {
    audioRef.current = new Audio(Success);
    audioRef.current.load();
  }, []);

  // --- HÀM MỞ KHÓA ÂM THANH ---
  const enableAudio = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.1;
      audioRef.current
        .play()
        .then(() => {
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
          audioRef.current!.volume = 1.0;

          setIsAudioEnabled(true);
          setShowWelcomeModal(false);
          api.success({ message: "Hệ thống đã sẵn sàng!" });
        })
        .catch((e) => {
          console.error("Lỗi mở khóa audio:", e);
          setShowWelcomeModal(false);
          api.warning({
            message: "Chưa mở khóa được âm thanh (Trình duyệt chặn)",
          });
        });
    } else {
      setShowWelcomeModal(false);
    }
  };

  const playBeep = () => {
    if (audioRef.current && isAudioEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => console.error("Lỗi phát tiếng:", e));
    }
  };

  useEffect(() => {
    // Kết nối Socket tới Python
    socketRef.current = io(PYTHON_SOCKET_URL, { transports: ["websocket"] });

    socketRef.current.on("connect", () => setIsConnected(true));
    socketRef.current.on("disconnect", () => setIsConnected(false));

    // Lắng nghe sự kiện từ Python (ESP32 gửi lên Python -> Python bắn ra đây)
    socketRef.current.on("nfc_scanned", (data: SocketNfcData) => {
      const uid = data.identifier;

      // 1. Kiểm tra trùng
      const isDuplicate = scannedCardsRef.current.some((c) => c.nfcUid === uid);

      if (isDuplicate) {
        api.warning({
          message: "Thẻ này vừa quét rồi!",
          description: `UID: ${uid}`,
          placement: "topRight",
          duration: 2,
        });
        return;
      }

      // 2. Nếu không trùng thì Beep và Thêm
      playBeep();

      const currentLength = scannedCardsRef.current.length;
      const newIndex = currentLength + counter;
      const codeName = `${prefix}_${String(newIndex).padStart(3, "0")}`;

      api.success({
        message: "Đã quét thẻ mới",
        description: `${codeName}`,
        placement: "bottomRight",
        duration: 1.5,
      });

      setScannedCards((prev) => {
        return [{ nfcUid: uid, code: codeName }, ...prev];
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [prefix, counter, api, isAudioEnabled]);

  const handleSave = async () => {
    if (scannedCards.length === 0) return;
    try {
      await axios.post(`${NEST_API}/bulk`, { cards: scannedCards });
      api.success({ message: "Đã lưu vào kho thành công!" });
      setScannedCards([]);
    } catch (err: any) {
      api.error({
        message: "Lỗi lưu thẻ",
        description: err.message || "Lỗi không xác định",
      });
    }
  };

  const columns: TableColumnsType<ScannedCardItem> = [
    { title: "STT", render: (_, __, i) => scannedCards.length - i, width: 60 },
    {
      title: "UID (Chip)",
      dataIndex: "nfcUid",
      render: (t: string) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: "Mã định danh",
      dataIndex: "code",
      render: (t: string) => <b>{t}</b>,
    },
    {
      title: "Xóa",
      render: (_, r) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() =>
            setScannedCards((prev) => prev.filter((c) => c.nfcUid !== r.nfcUid))
          }
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 20, background: "#f0f2f5", minHeight: "100vh" }}>
      {contextHolder}

      <Modal
        title="Sẵn sàng kết nối"
        open={showWelcomeModal}
        closable={false}
        maskClosable={false}
        centered
        footer={[
          <Button
            key="start"
            type="primary"
            size="large"
            icon={<SoundOutlined />}
            onClick={enableAudio}
          >
            BẮT ĐẦU QUÉT THẺ
          </Button>,
        ]}
      >
        <p>
          Nhấn nút bên dưới để kích hoạt hệ thống âm thanh và bắt đầu phiên làm
          việc.
        </p>
      </Modal>

      <Card
        title={
          <span>
            <QrcodeOutlined /> Nhập Kho Thẻ Hàng Loạt
          </span>
        }
        extra={
          isConnected ? (
            <Tag color="success">Scanner Online</Tag>
          ) : (
            <Tag color="error">Offline</Tag>
          )
        }
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
            padding: 15,
            background: "#fafafa",
            border: "1px solid #eee",
          }}
        >
          <Input
            addonBefore="Tiền tố"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            style={{ width: 150 }}
          />
          <Input
            type="number"
            addonBefore="Bắt đầu từ"
            value={counter}
            onChange={(e) => setCounter(Number(e.target.value))}
            style={{ width: 150 }}
          />
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <Statistic
              title="Số lượng thẻ"
              value={scannedCards.length}
              valueStyle={{ fontSize: 18 }}
            />
          </div>
        </div>

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
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <Button icon={<ClearOutlined />} onClick={() => setScannedCards([])}>
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
  );
};

export default BulkImportPage;
