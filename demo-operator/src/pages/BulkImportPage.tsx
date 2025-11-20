import React, { useEffect, useState, useRef } from "react";
import { Card, Table, Input, Button, Tag, notification, Statistic } from "antd";
import type { TableColumnsType } from "antd";
import {
  SaveOutlined,
  DeleteOutlined,
  ClearOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import { io, Socket } from "socket.io-client";
import axios from "axios";

// CẤU HÌNH IP
const PYTHON_SOCKET = "http://10.20.30.200:1836";
const NEST_API = "http://localhost:5000/api/guest-cards"; // API lưu thẻ

// 1. Định nghĩa kiểu dữ liệu cho thẻ được quét
interface ScannedCardItem {
  nfcUid: string;
  code: string;
}

// 2. Định nghĩa kiểu dữ liệu nhận từ Socket
interface SocketNfcData {
  identifier: string;
  [key: string]: any;
}

const BulkImportPage: React.FC = () => {
  const [scannedCards, setScannedCards] = useState<ScannedCardItem[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Cấu hình mã thẻ
  const [prefix, setPrefix] = useState<string>("CARD");
  const [counter, setCounter] = useState<number>(1);

  // Định kiểu cho useRef là Socket hoặc null
  const socketRef = useRef<Socket | null>(null);

  // Âm thanh bíp nhẹ
  const playBeep = () => {
    const audio = new Audio("https://www.soundjay.com/buttons/beep-07.wav");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    // 1. Kết nối Socket
    socketRef.current = io(PYTHON_SOCKET, { transports: ["websocket"] });

    socketRef.current.on("connect", () => setIsConnected(true));
    socketRef.current.on("disconnect", () => setIsConnected(false));

    // 2. Lắng nghe sự kiện quét thẻ
    socketRef.current.on("nfc_scanned", (data: SocketNfcData) => {
      const uid = data.identifier;
      playBeep();

      setScannedCards((prev) => {
        // Chống trùng lặp: Nếu thẻ vừa quét đã có trong list thì bỏ qua
        if (prev.some((c) => c.nfcUid === uid)) {
          notification.warning({
            message: "Thẻ này vừa quét rồi!",
            description: uid,
            duration: 1,
          });
          return prev;
        }

        // Tự động tạo mã định danh (VD: CARD_001)
        const newIndex = prev.length + counter;
        const codeName = `${prefix}_${String(newIndex).padStart(3, "0")}`;

        return [{ nfcUid: uid, code: codeName }, ...prev];
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [prefix, counter]);

  const handleSave = async () => {
    if (scannedCards.length === 0) return;
    try {
      // Gọi API NestJS Bulk Create
      await axios.post(`${NEST_API}/bulk`, { cards: scannedCards });
      notification.success({ message: "Đã lưu vào kho thành công!" });
      setScannedCards([]); // Xóa list sau khi lưu
    } catch (err: any) {
      notification.error({
        message: "Lỗi lưu thẻ",
        description: err.message || "Lỗi không xác định",
      });
    }
  };

  // Định nghĩa cột cho bảng Antd
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
        {/* Khu vực cấu hình */}
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
          pagination={{ pageSize: 5 }}
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
