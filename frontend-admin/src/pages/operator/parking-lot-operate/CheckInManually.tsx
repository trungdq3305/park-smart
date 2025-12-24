import React, { useState } from 'react'
import { Row, Col, Card, Form, Input, Upload, Button, Typography, message } from 'antd'
import {
  CarOutlined,
  QrcodeOutlined,
  IdcardOutlined,
  FileImageOutlined,
} from '@ant-design/icons'
import { useCheckInManuallyMutation } from '../../../features/operator/parkingSessionAPI'
import './CheckInManually.css'
import { getParkingLotId } from '../../../utils/parkingLotId'

const { Title, Text, Paragraph } = Typography

const CURRENT_PARKING_ID = getParkingLotId()

const CheckInManually: React.FC = () => {
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<any[]>([])
  const [checkInManually, { isLoading }] = useCheckInManuallyMutation()

  const handleSubmit = async (values: any) => {
    if (!CURRENT_PARKING_ID) {
      message.error('Không tìm thấy ParkingLotId, vui lòng mở lại màn Operator.')
      return
    }

    if (!fileList.length) {
      message.error('Vui lòng chọn ảnh chụp biển số xe.')
      return
    }

    const formData = new FormData()

    if (values.plateNumber) formData.append('plateNumber', values.plateNumber.trim())
    if (values.identifier) formData.append('identifier', values.identifier.trim())
    if (values.description) formData.append('description', values.description.trim())
    if (values.nfcUid) formData.append('nfcUid', values.nfcUid.trim())

    const file = fileList[0]?.originFileObj as File | undefined
    if (!file) {
      message.error('File ảnh không hợp lệ, vui lòng chọn lại.')
      return
    }
    formData.append('file', file)

    try {
      await checkInManually({ parkingLotId: CURRENT_PARKING_ID, data: formData }).unwrap()
      message.success('Check-in thủ công thành công')
      form.resetFields()
      setFileList([])
    } catch (error: any) {
      message.error(error?.data?.message || 'Check-in thủ công thất bại')
    }
  }

  return (
    <div className="manual-checkin-page">
      <Row justify="center" className="manual-checkin-row">
        <Col xs={24} lg={20} xl={18}>
          <Card className="manual-checkin-card" bordered={false}>
            <Row gutter={[32, 32]}>
              <Col xs={24} md={11}>
                <div className="manual-checkin-hero">
                  <Title level={3} className="manual-checkin-title">
                    Check In Thủ Công
                  </Title>
                  <Paragraph className="manual-checkin-subtitle">
                    Sử dụng khi Kiosk hoặc camera gặp sự cố. Nhập thông tin và tải lên ảnh biển số để
                    hệ thống vẫn ghi nhận phiên gửi xe chính xác.
                  </Paragraph>
                  <div className="manual-checkin-highlight">
                    <Text strong>Thông tin cần nhập</Text>
                    <ul>
                      <li>
                        <CarOutlined /> Biển số xe (bắt buộc với khách vãng lai)
                      </li>
                      <li>
                        <QrcodeOutlined /> Mã định danh QR / vé giấy (nếu có)
                      </li>
                      <li>
                        <IdcardOutlined /> UID thẻ NFC (nếu có)
                      </li>
                      <li>
                        <FileImageOutlined /> Ảnh chụp biển số (bắt buộc)
                      </li>
                    </ul>
                  </div>
                  <Text type="secondary">
                    Gợi ý: chụp rõ biển số và đầu xe, tránh lóa đèn để hỗ trợ đối chiếu khi khách
                    ra.
                  </Text>
                </div>
              </Col>

              <Col xs={24} md={13}>
                <div className="manual-checkin-form-wrapper">
                  <Title level={4} className="manual-checkin-form-title">
                    Thông tin xe vào bãi
                  </Title>
                  <Form
                    layout="vertical"
                    form={form}
                    onFinish={handleSubmit}
                    disabled={isLoading}
                    className="manual-checkin-form"
                  >
                    <Form.Item
                      label="Biển số xe"
                      name="plateNumber"
                      rules={[{ required: true, message: 'Vui lòng nhập biển số xe' }]}
                    >
                      <Input
                        size="large"
                        prefix={<CarOutlined />}
                        placeholder="Ví dụ: 51A-123.45"
                        className="manual-checkin-input"
                      />
                    </Form.Item>

                    <Form.Item label="Mã định danh (QR / vé giấy)" name="identifier">
                      <Input
                        size="large"
                        prefix={<QrcodeOutlined />}
                        placeholder="Nhập mã QR / mã vé nếu có"
                        className="manual-checkin-input"
                      />
                    </Form.Item>

                    <Form.Item label="UID thẻ NFC" name="nfcUid">
                      <Input
                        size="large"
                        prefix={<IdcardOutlined />}
                        placeholder="Nhập UID thẻ NFC nếu có"
                        className="manual-checkin-input"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Mô tả (tuỳ chọn)"
                      name="description"
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="Ví dụ: Xe vào cổng số 1, biển số khó đọc..."
                        className="manual-checkin-textarea"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Ảnh chụp biển số xe"
                      required
                      validateStatus={!fileList.length ? 'error' : ''}
                      help={!fileList.length ? 'Vui lòng chọn ít nhất một ảnh' : ''}
                    >
                      <Upload.Dragger
                        name="file"
                        multiple={false}
                        fileList={fileList}
                        accept="image/*"
                        beforeUpload={() => false}
                        onChange={({ fileList: newList }) => setFileList(newList)}
                        className="manual-checkin-uploader"
                      >
                        <p className="ant-upload-drag-icon">
                          <FileImageOutlined />
                        </p>
                        <p className="ant-upload-text">Kéo file vào đây hoặc bấm để chọn ảnh</p>
                        <p className="ant-upload-hint">Hỗ trợ .jpg, .jpeg, .png, kích thước &lt; 10MB</p>
                      </Upload.Dragger>
                    </Form.Item>

                    <Form.Item>
                      <div className="manual-checkin-actions">
                        <Button
                          onClick={() => {
                            form.resetFields()
                            setFileList([])
                          }}
                          disabled={isLoading}
                        >
                          Xoá thông tin
                        </Button>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={isLoading}
                          className="manual-checkin-submit"
                        >
                          Gửi yêu cầu Check In
                        </Button>
                      </div>
                    </Form.Item>
                  </Form>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default CheckInManually