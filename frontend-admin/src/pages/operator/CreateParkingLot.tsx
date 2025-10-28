import React from 'react'
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  TimePicker,
  DatePicker,
  Switch,
  message,
  Typography,
  Divider,
  Tag,
  Select,
} from 'antd'
import { useCreateParkingLotMutation } from '../../features/operator/parkingLotAPI'
import dayjs from 'dayjs'
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
  SendOutlined,
  ReloadOutlined,
  CalendarOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import './CreateParkingLot.css'
import { useGetWardQuery } from '../../features/operator/wardAPI'
import type { Ward } from '../../types/Ward'
import { useCreateAddressMutation } from '../../features/operator/addressAPI'

interface WardResponse {
  data: {
    data: Ward[][]
  }
  isLoading: boolean
}
const CreateParkingLot: React.FC = () => {
  const [form] = Form.useForm()
  const [createParkingLot, { isLoading }] = useCreateParkingLotMutation()
  const { data: wards, isLoading: isLoadingWards } = useGetWardQuery<WardResponse>({})
  const wardData = wards?.data?.[0] || []
  const [createAddress] = useCreateAddressMutation()

  const onFinish = async (values: any) => {
    const is24Hours = Boolean(values.is24Hours)
    try {
      // Step 1: Create Address to obtain addressId
      const createdAddress: any = await createAddress({
        wardId: values.wardId,
        fullAddress: values.fullAddress,
      }).unwrap()

      const addressId = createdAddress?.data?.[0]?._id 
      if (!addressId) {
        throw new Error('Không lấy được addressId từ API tạo địa chỉ')
      }
      // Step 2: Create Parking Lot using the returned addressId
      const payload = {
        addressId,
        openTime: is24Hours ? '00:00' : values.openTime ? values.openTime.format('HH:mm') : null,
        closeTime: is24Hours ? '23:59' : values.closeTime ? values.closeTime.format('HH:mm') : null,
        is24Hours,
        maxVehicleHeight:
          values.maxVehicleHeight != null ? Number(values.maxVehicleHeight) : null,
        maxVehicleWidth: values.maxVehicleWidth != null ? Number(values.maxVehicleWidth) : null,
        totalCapacityEachLevel:
          values.totalCapacityEachLevel != null ? Number(values.totalCapacityEachLevel) : null,
        totalLevel: values.totalLevel != null ? Number(values.totalLevel) : null,
        electricCarPercentage:
          values.electricCarPercentage != null ? Number(values.electricCarPercentage) : null,
        effectiveDate: values.effectiveDate ? values.effectiveDate.format('YYYY-MM-DD') : null,
      }

      await createParkingLot(payload).unwrap()
      message.success('Yêu cầu tạo bãi đỗ xe đã được gửi tới Admin')
      form.resetFields()
    } catch (err: unknown) {
      const extractMessage = (e: unknown): string => {
        if (typeof e === 'object' && e !== null) {
          const withData = e as { data?: unknown; message?: unknown }
          if (withData.data && typeof (withData.data as any).message === 'string') {
            return (withData.data as any).message as string
          }
          if (typeof withData.message === 'string') return withData.message
        }
        if (e instanceof Error) return e.message
        if (typeof e === 'string') return e
        return 'Gửi yêu cầu thất bại'
      }

      message.error(extractMessage(err))
    }
  }

  return (
    <Space direction="vertical" size={24} className="create-lot-wrapper">
      <Card className="create-lot-hero">
        <Row align="middle" gutter={[16, 16]}>
          <Col flex="none">
            <div className="hero-icon">
              <DashboardOutlined style={{ fontSize: 28, color: '#fff' }} />
            </div>
          </Col>
          <Col flex="auto">
            <Typography.Title level={3} className="hero-title">
              Tạo yêu cầu bãi đỗ xe mới
            </Typography.Title>
            <Typography.Paragraph className="hero-subtitle">
              Gửi thông tin chi tiết để Admin xem xét và phê duyệt yêu cầu của bạn
            </Typography.Paragraph>
          </Col>
          <Col flex="none">
            <Tag color="gold" className="hero-badge">
              Operator
            </Tag>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <span>
            <EnvironmentOutlined /> Thông tin địa chỉ & lịch hoạt động
          </span>
        }
        className="section-card"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          initialValues={{
            is24Hours: true,
            openTime: dayjs('08:00', 'HH:mm'),
            closeTime: dayjs('17:00', 'HH:mm'),
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Form.Item
                label={
                  <Space>
                    <EnvironmentOutlined />
                    <span>Phường</span>
                  </Space>
                }
                name="wardId"
                rules={[{ required: true, message: 'Vui lòng chọn phường' }]}
              >
                <Select
                  placeholder="Chọn phường"
                  loading={isLoadingWards}
                  showSearch
                  optionFilterProp="label"
                  options={wardData?.map((w: Ward) => ({
                    key: w._id,
                    label: w.wardName,
                    value: w._id,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Form.Item
                label={
                  <Space>
                    <EnvironmentOutlined />
                    <span>Địa chỉ đầy đủ</span>
                  </Space>
                }
                name="fullAddress"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
              >
                <Input placeholder="VD: 29 Lê Duẩn, Phường Bến Nghé, Quận 1" />
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Form.Item label="Hoạt động 24/7" name="is24Hours" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={12} lg={6}>
              <Form.Item shouldUpdate noStyle>
                {() => (
                  <Form.Item
                    label={
                      <Space>
                        <ClockCircleOutlined />
                        <span>Giờ mở cửa</span>
                      </Space>
                    }
                    name="openTime"
                    rules={
                      form.getFieldValue('is24Hours')
                        ? []
                        : [{ required: true, message: 'Chọn giờ mở cửa' }]
                    }
                  >
                    <TimePicker
                      format="HH:mm"
                      className="w-100"
                      disabled={form.getFieldValue('is24Hours')}
                    />
                  </Form.Item>
                )}
              </Form.Item>
            </Col>
            <Col xs={12} lg={6}>
              <Form.Item shouldUpdate noStyle>
                {() => (
                  <Form.Item
                    label={
                      <Space>
                        <ClockCircleOutlined />
                        <span>Giờ đóng cửa</span>
                      </Space>
                    }
                    name="closeTime"
                    rules={
                      form.getFieldValue('is24Hours')
                        ? []
                        : [{ required: true, message: 'Chọn giờ đóng cửa' }]
                    }
                  >
                    <TimePicker
                      format="HH:mm"
                      className="w-100"
                      disabled={form.getFieldValue('is24Hours')}
                    />
                  </Form.Item>
                )}
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined />
                    <span>Ngày hiệu lực</span>
                  </Space>
                }
                name="effectiveDate"
                rules={[{ required: true, message: 'Chọn ngày hiệu lực' }]}
              >
                <DatePicker format="YYYY-MM-DD" className="w-100" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Typography.Title level={5} style={{ marginBottom: 12 }}>
            Quy mô & kích thước
          </Typography.Title>
          <Row gutter={[16, 16]}>
            <Col xs={12} lg={6}>
              <Form.Item
                label="Chiều cao xe tối đa (m)"
                name="maxVehicleHeight"
                rules={[{ required: true, message: 'Nhập chiều cao tối đa' }]}
              >
                <InputNumber min={0} step={0.1} className="w-100" placeholder="VD: 2.5" />
              </Form.Item>
            </Col>
            <Col xs={12} lg={6}>
              <Form.Item
                label="Chiều rộng xe tối đa (m)"
                name="maxVehicleWidth"
                rules={[{ required: true, message: 'Nhập chiều rộng tối đa' }]}
              >
                <InputNumber min={0} step={0.1} className="w-100" placeholder="VD: 2" />
              </Form.Item>
            </Col>
            <Col xs={12} lg={6}>
              <Form.Item
                label="Sức chứa mỗi tầng"
                name="totalCapacityEachLevel"
                rules={[{ required: true, message: 'Nhập sức chứa/tầng' }]}
              >
                <InputNumber min={1} className="w-100" placeholder="VD: 50" />
              </Form.Item>
            </Col>
            <Col xs={12} lg={6}>
              <Form.Item
                label="Tổng số tầng"
                name="totalLevel"
                rules={[{ required: true, message: 'Nhập số tầng' }]}
              >
                <InputNumber min={1} className="w-100" placeholder="VD: 5" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={6}>
              <Form.Item
                label={
                  <Space>
                    <ThunderboltOutlined />
                    <span>% chỗ cho xe điện</span>
                  </Space>
                }
                name="electricCarPercentage"
                rules={[{ required: true, message: 'Nhập phần trăm' }]}
              >
                <InputNumber min={0} max={100} step={1} className="w-100" placeholder="VD: 20" />
              </Form.Item>
            </Col>
          </Row>

          <Space className="form-actions" size="middle">
            <Button icon={<ReloadOutlined />} onClick={() => form.resetFields()}>
              Làm mới
            </Button>
            <Button type="primary" icon={<SendOutlined />} htmlType="submit" loading={isLoading}>
              Gửi yêu cầu
            </Button>
          </Space>
        </Form>
      </Card>
    </Space>
  )
}

export default CreateParkingLot
