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

// Đảm bảo đường dẫn file này đúng trong dự án của bạn
import Success from "../assets/success.mp3";

const PYTHON_SOCKET = "http://10.20.30.200:1836";
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

  // Notification Hook (Khắc phục lỗi không hiện thông báo)
  const [api, contextHolder] = antdNotification.useNotification();

  // Đồng bộ Ref để Socket luôn thấy dữ liệu mới nhất
  useEffect(() => {
    scannedCardsRef.current = scannedCards;
  }, [scannedCards]);

  // Khởi tạo Audio 1 lần duy nhất
  useEffect(() => {
    audioRef.current = new Audio(Success);
    audioRef.current.load(); // Tải trước
  }, []);

  // --- HÀM MỞ KHÓA ÂM THANH (Chạy khi bấm nút trên Modal) ---
  const enableAudio = () => {
    if (audioRef.current) {
      // Phát thử 1 đoạn cực ngắn để trình duyệt ghi nhận tương tác
      audioRef.current.volume = 0.1;
      audioRef.current
        .play()
        .then(() => {
          // Ngay lập tức dừng và reset volume
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
          audioRef.current!.volume = 1.0;

          setIsAudioEnabled(true);
          setShowWelcomeModal(false);
          api.success({ message: "Hệ thống đã sẵn sàng!" });
        })
        .catch((e) => {
          console.error("Lỗi mở khóa audio:", e);
          // Vẫn cho đóng modal nhưng cảnh báo
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
    socketRef.current = io(PYTHON_SOCKET, { transports: ["websocket"] });

    socketRef.current.on("connect", () => setIsConnected(true));
    socketRef.current.on("disconnect", () => setIsConnected(false));

    socketRef.current.on("nfc_scanned", (data: SocketNfcData) => {
      const uid = data.identifier;

      // 1. Phát âm thanh

      // 2. Kiểm tra trùng lặp bằng Ref
      const isDuplicate = scannedCardsRef.current.some((c) => c.nfcUid === uid);

      if (isDuplicate) {
        api.warning({
          message: "Thẻ này vừa quét rồi!",
          description: `UID: ${uid}`,
          placement: "topRight",
          duration: 2,
        });
        return;
      } else {
        playBeep();
      }

      // --- SỬA ĐỔI: TÍNH TOÁN VÀ THÔNG BÁO RA NGOÀI ---

      // a. Tính toán dữ liệu mới dựa trên Ref
      const currentLength = scannedCardsRef.current.length;
      const newIndex = currentLength + counter;
      const codeName = `${prefix}_${String(newIndex).padStart(3, "0")}`;

      // b. Hiện thông báo (Chỉ chạy 1 lần tại đây)
      api.success({
        message: "Đã quét thẻ mới",
        description: `${codeName}`,
        placement: "bottomRight",
        duration: 1.5,
      });

      // c. Cập nhật State (Chỉ làm nhiệm vụ update dữ liệu)
      setScannedCards((prev) => {
        return [{ nfcUid: uid, code: codeName }, ...prev];
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix, counter, api, isAudioEnabled]); // Thêm các dependencies cần thiết

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
      {/* Context Holder cho Notification */}
      {contextHolder}

      {/* MODAL BẮT BUỘC ĐỂ KÍCH HOẠT ÂM THANH */}
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
