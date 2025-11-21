/* eslint-disable @typescript-eslint/no-explicit-any */
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

import Success from "../assets/success.mp3";

const { Header, Content } = Layout;
const { Title } = Typography;

// 👉 CẬP NHẬT: URL Hostname
const PYTHON_URL = "http://PhamVietHoang:1836";
const LIVE_STREAM_URL = `${PYTHON_URL}/video_feed`;

interface ScanData {
  identifier: string;
  plateNumber?: string;
  image?: string;
  timestamp?: number;
  type?: string; // 'NFC' hoặc 'QR_APP'
}

const KioskPage: React.FC = () => {
  const [notificationForData, contextHolder] = notification.useNotification();
  // State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [cardUid, setCardUid] = useState<string>("---");
  const [plateNumber, setPlateNumber] = useState<string>("");
  const [timeIn, setTimeIn] = useState<string>("---");
  const [timeOut, setTimeOut] = useState<string>("---");
  const [customerType, setCustomerType] = useState<string>("Khách vãng lai");
  const [parkingFee, setParkingFee] = useState<number>(0);

  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(Success);
    audioRef.current.load();
  }, []);

  const playBeep = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  // Hàm xử lý chung cho cả QR và NFC
  const handleNewScan = (data: ScanData) => {
    playBeep();

    // 1. Cập nhật ảnh chụp
    if (data.image) setSnapshot(data.image);

    // 2. Cập nhật mã định danh (UID hoặc QR content)
    setCardUid(data.identifier);

    // 3. Cập nhật biển số (nếu AI nhận diện được)
    if (data.plateNumber) {
      setPlateNumber(data.plateNumber);
    } else {
      // Nếu không nhận diện được thì giữ nguyên hoặc báo không rõ,
      // tránh ghi đè nếu đang nhập tay
      if (!plateNumber) setPlateNumber("KHONG_RO");
    }

    // 4. Logic giả lập tính tiền (Demo)
    const now = new Date();
    setTimeOut(now.toLocaleString());
    const mockTimeIn = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    setTimeIn(mockTimeIn.toLocaleString());
    setParkingFee(10000);

    // Phân loại khách
    if (data.type === "QR_APP") {
      setCustomerType("Khách dùng App (QR)");
    } else if (data.identifier.length > 20) {
      setCustomerType("Vé Tháng");
      setParkingFee(0);
    } else {
      setCustomerType("Khách Vãng Lai (NFC)");
    }

    notificationForData.info({
      message: `Phát hiện xe (${data.type})`,
      description: `ID: ${data.identifier} - Biển: ${data.plateNumber || "N/A"}`,
      placement: "bottomRight",
    });
  };

  useEffect(() => {
    socketRef.current = io(PYTHON_URL, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      setIsConnected(true);
      notificationForData.success({
        message: "Hệ thống Online",
        description: "Đã kết nối tới Python Gateway",
      });
    });

    socketRef.current.on("disconnect", () => setIsConnected(false));

    // 👉 LẮNG NGHE NFC (Từ ESP32 -> Python -> React)
    socketRef.current.on("nfc_scanned", (data: ScanData) => {
      handleNewScan({ ...data, type: "NFC" });
    });

    // 👉 LẮNG NGHE QR (Từ Webcam Python -> React)
    socketRef.current.on("scan_result", (data: ScanData) => {
      // QR thường quét liên tục, có thể cần debounce nếu muốn
      handleNewScan({ ...data, type: "QR_APP" });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Hàm mở cổng thủ công (Gọi API Python Local)
  const openBarrier = async () => {
    try {
      // Gọi endpoint POST như yêu cầu của bạn
      const response = await axios.post(`${PYTHON_URL}/confirm-checkin`, {
        plateNumber: plateNumber, // Gửi kèm biển số nếu cần log
        identifier: cardUid,
      });

      if (response.data.success) {
        notificationForData.success({
          message: "Thành công",
          description: "Đang mở cổng...",
        });
      }
    } catch (error: any) {
      // Lấy thông báo lỗi từ Python gửi về
      const errorMessage =
        error.response?.data?.message || "Lỗi kết nối Barie!";
      console.log(error.response?.data?.message);
      notificationForData.error({
        message: "Không thể mở cổng",
        description: errorMessage,
        duration: 3,
      });
    }
  };

  return (
    <Layout style={{ height: "100vh", background: "#141414" }}>
      {contextHolder}
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
            HỆ THỐNG QUẢN LÝ BÃI XE
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
          <Col
            span={16}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <Card
              title={
                <span>
                  <VideoCameraOutlined /> Camera Giám Sát
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

            <Card
              title={
                <span>
                  <CameraOutlined /> Ảnh Chụp Sự Kiện
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
              <div
                style={{
                  marginBottom: 20,
                  background: "#f0f2f5",
                  padding: 15,
                  borderRadius: 8,
                }}
              >
                <span style={{ color: "#888", fontSize: 12 }}>
                  BIỂN SỐ XE (AI)
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
                <Descriptions.Item label="Mã thẻ / QR">
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
