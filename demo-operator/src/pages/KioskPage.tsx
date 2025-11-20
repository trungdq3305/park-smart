import React, { useEffect, useState, useRef } from "react";
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
  notification,
  Badge,
  Space,
} from "antd";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import {
  VideoCameraOutlined,
  CameraOutlined,
  CarOutlined,
  ScanOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";

import Success from "../assets/ding_sound_effect-www_tiengdong_com.mp3";
const { Header, Content } = Layout;
const { Title } = Typography;

// --- CẤU HÌNH ---
const PYTHON_URL = "http://10.20.30.200:1836";
const LIVE_STREAM_URL = `${PYTHON_URL}/video_feed`; // URL stream video MJPEG từ Python

interface NfcSocketData {
  identifier: string;
  plateNumber?: string;
  image?: string;
  timestamp?: number;
  type?: string;
}

const KioskPage: React.FC = () => {
  // State kết nối
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // State dữ liệu hiển thị
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [cardUid, setCardUid] = useState<string>("---");
  const [plateNumber, setPlateNumber] = useState<string>(""); // State cho ô nhập biển số
  const [timeIn, setTimeIn] = useState<string>("---");
  const [timeOut, setTimeOut] = useState<string>("---");
  const [customerType, setCustomerType] = useState<string>("Khách vãng lai");
  const [parkingFee, setParkingFee] = useState<number>(0);

  const socketRef = useRef<Socket | null>(null);

  // Âm thanh
  const playBeep = () => {
    const audio = new Audio(Success);
    audio.play().catch(() => {});
  };

  const handleNewScan = (data: NfcSocketData) => {
    // 1. Cập nhật ảnh chụp
    if (data.image) setSnapshot(data.image);

    // 2. Cập nhật thông tin thẻ
    setCardUid(data.identifier);

    // 3. Cập nhật biển số (Cho phép sửa sau này)
    setPlateNumber(data.plateNumber || "KHONG_RO");

    // 4. Giả lập logic tính toán thời gian (Vì đang bypass Backend)
    const now = new Date();
    setTimeOut(now.toLocaleString());

    // Giả sử xe vào cách đây 2 tiếng để demo tính tiền
    const mockTimeIn = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    setTimeIn(mockTimeIn.toLocaleString());

    // 5. Giả lập tính tiền
    setParkingFee(10000); // Ví dụ 10k

    // Phân loại khách (Dựa vào độ dài UID hoặc logic Python gửi về)
    if (data.identifier.length > 20) {
      setCustomerType("Khách Vé Tháng / App");
      setParkingFee(0); // Vé tháng miễn phí
    } else {
      setCustomerType("Khách Vãng Lai (Thẻ)");
    }

    notification.info({
      message: "Phát hiện xe",
      description: `UID: ${data.identifier}`,
    });
  };

  useEffect(() => {
    socketRef.current = io(PYTHON_URL, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      setIsConnected(true);
      notification.success({
        message: "Hệ thống Online",
        description: "Đã kết nối tới Camera & Đầu đọc thẻ",
      });
    });

    socketRef.current.on("disconnect", () => setIsConnected(false));

    // LẮNG NGHE SỰ KIỆN QUÉT THẺ
    socketRef.current.on("nfc_scanned", (data: NfcSocketData) => {
      playBeep();
      handleNewScan(data);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Hàm gọi mở cổng
  const openBarrier = async () => {
    try {
      await axios.get(`${PYTHON_URL}/open-barrier-command`);
      notification.success({
        message: "Đang mở cổng...",
        description: `Đã xác nhận cho xe ${plateNumber} qua trạm.`,
      });
      // Reset sau khi mở
      // setSnapshot(null); // Tùy chọn: có muốn xóa ảnh luôn không
    } catch (e) {
      notification.error({ message: "Lỗi kết nối Barie!" });
    }
  };

  return (
    <Layout style={{ height: "100vh", background: "#141414" }}>
      {/* HEADER */}
      <Header
        style={{
          background: "#001529",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/vite.svg" alt="Logo" style={{ height: 30 }} />
          <Title level={4} style={{ color: "white", margin: 0 }}>
            HỆ THỐNG QUẢN LÝ BÃI XE THÔNG MINH
          </Title>
        </div>
        <Space>
          {isConnected ? (
            <Tag color="success">🟢 SERVER ONLINE</Tag>
          ) : (
            <Tag color="error">🔴 SERVER OFFLINE</Tag>
          )}
          <Tag color="blue">TRẠM SỐ: 01</Tag>
        </Space>
      </Header>

      <Content style={{ padding: "10px" }}>
        <Row gutter={[10, 10]} style={{ height: "100%" }}>
          {/* CỘT TRÁI: KHUNG HÌNH CAMERA (Chiếm 70% chiều rộng) */}
          <Col
            span={16}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            {/* 1. CAMERA TRỰC TIẾP (LIVE) */}
            <Card
              title={
                <span>
                  <VideoCameraOutlined /> Camera Giám Sát (Trực tiếp)
                </span>
              }
              bordered={false}
              bodyStyle={{
                padding: 0,
                background: "#000",
                height: "45vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* Dùng thẻ IMG để load stream MJPEG */}
              <img
                src={LIVE_STREAM_URL}
                alt="Live Feed"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </Card>

            {/* 2. ẢNH CHỤP SỰ KIỆN (SNAPSHOT) */}
            <Card
              title={
                <span>
                  <CameraOutlined /> Ảnh Chụp Sự Kiện (Check-in/Check-out)
                </span>
              }
              bordered={false}
              bodyStyle={{
                padding: 0,
                background: "#222",
                height: "38vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {snapshot ? (
                <img
                  src={snapshot}
                  alt="Snapshot"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div style={{ color: "#555" }}>Chưa có lượt quét nào...</div>
              )}
            </Card>
          </Col>

          {/* CỘT PHẢI: THÔNG TIN & ĐIỀU KHIỂN (Chiếm 30% chiều rộng) */}
          <Col span={8}>
            <Card
              title="THÔNG TIN GIAO DỊCH"
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
              bodyStyle={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              {/* Thông tin biển số (Cho phép sửa) */}
              <div
                style={{
                  marginBottom: 20,
                  background: "#f0f2f5",
                  padding: 15,
                  borderRadius: 8,
                }}
              >
                <span style={{ color: "#888", fontSize: 12 }}>
                  BIỂN SỐ XE (Nhận diện AI)
                </span>
                <Input
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  prefix={<CarOutlined />}
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: "#d4380d",
                    textAlign: "center",
                    marginTop: 5,
                  }}
                  suffix={<EditOutlined style={{ color: "#aaa" }} />}
                />
              </div>

              {/* Thông tin chi tiết */}
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Loại khách">
                  <Tag
                    color={
                      customerType.includes("Vãng Lai") ? "orange" : "green"
                    }
                  >
                    {customerType}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Mã thẻ (UID)">
                  <Space>
                    <ScanOutlined /> <b>{cardUid}</b>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian vào">
                  {timeIn}
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian ra">
                  {timeOut}
                </Descriptions.Item>
              </Descriptions>

              <div
                style={{
                  marginTop: 20,
                  textAlign: "center",
                  padding: 20,
                  background: "#fffbe6",
                  border: "1px solid #ffe58f",
                  borderRadius: 8,
                }}
              >
                <Statistic
                  title="PHÍ GỬI XE"
                  value={parkingFee}
                  precision={0}
                  valueStyle={{
                    color: "#cf1322",
                    fontWeight: "bold",
                    fontSize: 32,
                  }}
                  prefix={<DollarOutlined />}
                  suffix="VNĐ"
                />
              </div>

              <div style={{ marginTop: "auto", paddingTop: 20 }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<CheckCircleOutlined />}
                  style={{
                    height: 60,
                    fontSize: 20,
                    background: "#389e0d",
                    borderColor: "#389e0d",
                  }}
                  onClick={openBarrier}
                >
                  XÁC NHẬN & MỞ CỔNG
                </Button>

                <Button danger block style={{ marginTop: 10 }}>
                  HỦY BỎ / TỪ CHỐI
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default KioskPage;
