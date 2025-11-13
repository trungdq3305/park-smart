import React, { useState } from 'react'
import {
  Button,
  Input,
  Form,
  Typography,
  notification,
  Select,
  Switch,
  DatePicker,
  TimePicker,
  InputNumber,
  Row,
  Col,
  Space,
  Steps,
  Checkbox,
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  BankOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useRegisterMutation } from '../../features/auth/authApi'
import { useGetWardQuery } from '../../features/operator/wardAPI'
import { useCreateAddressMutation } from '../../features/operator/addressAPI'
import { useCreateParkingLotMutation } from '../../features/operator/parkingLotAPI'
import type { Ward } from '../../types/Ward'

const { Title, Text } = Typography

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

interface RegisterFormValues {
  email: string
  password: string
  phoneNumber: string
  paymentEmail: string
  fullName: string
  wardId: string
  fullAddress: string
  is24Hours: boolean
  isAgreeToP: boolean
  openTime?: dayjs.Dayjs | null
  closeTime?: dayjs.Dayjs | null
  effectiveDate: dayjs.Dayjs
  maxVehicleHeight: number
  maxVehicleWidth: number
  totalCapacityEachLevel: number
  totalLevel: number
  electricCarPercentage: number
  bussinessName: string
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [register] = useRegisterMutation()
  const [step, setStep] = useState(1)
  const [isAgreeToP, setIsAgreeToP] = useState(false)
  const { data: wards, isLoading: isLoadingWards } = useGetWardQuery({})
  const wardData = (wards?.data?.[0] as Ward[]) || []
  const [createAddress, { isLoading: isCreatingAddress }] = useCreateAddressMutation()
  const [createParkingLot, { isLoading: isCreatingParkingLot }] = useCreateParkingLotMutation()
  const [formData, setFormData] = useState<Partial<RegisterFormValues>>({})

  const nextStep = async () => {
    try {
      await form.validateFields([
        'fullName',
        'email',
        'phoneNumber',
        'password',
        'confirmPassword',
        'paymentEmail',
      ])
      setFormData((prev) => ({ ...prev, ...form.getFieldsValue() }))
      setStep((prev) => prev + 1)
    } catch (error) {
      // validation errors handled by antd
    }
  }
  const prevStep = () => {
    setStep(step - 1)
    form.setFieldsValue(formData)
  }

  const onFinish = async (values: RegisterFormValues) => {
    setLoading(true)
    const mergedValues = { ...formData, ...values } as RegisterFormValues
    try {
      const registerData = {
        email: mergedValues.email,
        password: mergedValues.password,
        paymentEmail: mergedValues.paymentEmail,
        phoneNumber: mergedValues.phoneNumber,
        fullName: mergedValues.fullName,
        bussinessName: mergedValues.bussinessName,
        isAgreeToP: mergedValues.isAgreeToP,
      }
      await register(registerData).unwrap()

      const createdAddress = await createAddress({
        wardId: mergedValues.wardId,
        fullAddress: mergedValues.fullAddress,
      }).unwrap()

      const addressId = createdAddress?.data?.[0]?._id
      if (!addressId) {
        throw new Error('Không lấy được addressId từ API tạo địa chỉ')
      }

      const is24Hours = Boolean(mergedValues.is24Hours)
      const payload = {
        addressId,
        openTime: is24Hours
          ? '00:00'
          : mergedValues.openTime
          ? mergedValues.openTime.format('HH:mm')
          : null,
        closeTime: is24Hours
          ? '23:59'
          : mergedValues.closeTime
          ? mergedValues.closeTime.format('HH:mm')
          : null,
        is24Hours,
        maxVehicleHeight:
          mergedValues.maxVehicleHeight != null ? Number(mergedValues.maxVehicleHeight) : null,
        maxVehicleWidth:
          mergedValues.maxVehicleWidth != null ? Number(mergedValues.maxVehicleWidth) : null,
        totalCapacityEachLevel:
          mergedValues.totalCapacityEachLevel != null
            ? Number(mergedValues.totalCapacityEachLevel)
            : null,
        totalLevel: mergedValues.totalLevel != null ? Number(mergedValues.totalLevel) : null,
        electricCarPercentage:
          mergedValues.electricCarPercentage != null
            ? Number(mergedValues.electricCarPercentage)
            : null,
        effectiveDate: mergedValues.effectiveDate
          ? mergedValues.effectiveDate.format('YYYY-MM-DD')
          : null,
      }

      await createParkingLot(payload).unwrap()

      notification.success({
        message: 'Đăng ký thành công!',
        description: `Người dùng ${mergedValues.fullName} đã tạo tài khoản thành công với email đăng nhập là ${mergedValues.email}`,
        duration: 4.5,
      })
      notification.success({
        message: 'Gửi yêu cầu bãi đỗ xe thành công',
        description:
          'Thông tin yêu cầu bãi đỗ xe đã được gửi tới Admin. Vui lòng chờ xét duyệt để tiếp tục sử dụng hệ thống.',
        duration: 4.5,
      })
      form.resetFields()
      setStep(1)
      setIsAgreeToP(false)
      setFormData({})
    } catch (error: unknown) {
      let errorMessage = 'Đã xảy ra lỗi không xác định'

      // Kiểm tra nếu error là một đối tượng
      if (error && typeof error === 'object') {
        // Kiểm tra lỗi từ data.error (dựa trên ví dụ API)
        if (
          'data' in error &&
          error.data &&
          typeof error.data === 'object' &&
          'error' in error.data
        ) {
          errorMessage = (error.data as { error: string }).error
        }
        // Kiểm tra lỗi từ message (nếu có)
        else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message
        }
        // Kiểm tra lỗi từ meta.response.data (nếu lỗi từ Axios hoặc tương tự)
        else if (
          'meta' in error &&
          error.meta &&
          typeof error.meta === 'object' &&
          'response' in error.meta &&
          error.meta.response &&
          typeof error.meta.response === 'object' &&
          'data' in error.meta.response &&
          error.meta.response.data &&
          typeof error.meta.response.data === 'object' &&
          'error' in error.meta.response.data
        ) {
          errorMessage = (error.meta.response.data as { error: string }).error
        }
      }

      notification.error({
        message: 'Đăng ký thất bại',
        description: errorMessage,
        duration: 4.5,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-form-container">
      <Title level={2} className="brand-title">
        ParkSmart
      </Title>
      <Title level={3} className="welcome-title">Tạo tài khoản chủ bãi đỗ xe</Title>

      <Text className="signup-prompt">
        Đã có tài khoản?
        <span onClick={onSwitchToLogin} className="signup-link">
          Đăng nhập tại đây
        </span>
      </Text>

      <Form
        form={form}
        name="register"
        onFinish={onFinish}
        layout="vertical"
        className="login-form"
        initialValues={{
          is24Hours: true,
          openTime: dayjs('08:00', 'HH:mm'),
          closeTime: dayjs('17:00', 'HH:mm'),
          isAgreeToP: false,
        }}
      >
        <Steps
          current={step - 1}
          items={[{ title: 'Thông tin tài khoản' }, { title: 'Thông tin bãi đỗ' }]}
          size="small"
          style={{ marginBottom: 24 }}
        />
        {step === 1 && (
          <>
            <Form.Item
              name="fullName"
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Họ và tên"
                size="large"
                className="login-input"
              />
            </Form.Item>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Email"
                size="large"
                className="login-input"
              />
            </Form.Item>
            <Form.Item
              name="paymentEmail"
              rules={[
                { required: true, message: 'Vui lòng nhập email thanh toán!' },
                { type: 'email', message: 'Email không hợp lệ!' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Email thanh toán"
                size="large"
                className="login-input"
              />
            </Form.Item>
            <Form.Item
              name="phoneNumber"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại!' },
                {
                  pattern: /^\d{10,11}$/,
                  message: 'Số điện thoại không hợp lệ',
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="Số điện thoại"
                size="large"
                className="login-input"
              />
            </Form.Item>
            <Form.Item
              name="bussinessName"
              rules={[{ required: true, message: 'Vui lòng nhập tên doanh nghiệp!' }]}
            >
              <Input
                prefix={<BankOutlined />}
                placeholder="Tên doanh nghiệp"
                size="large"
                className="login-input"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message:
                    'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt!',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Mật khẩu"
                size="large"
                className="login-input"
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('Mật khẩu không khớp!'))
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Xác nhận mật khẩu"
                size="large"
                className="login-input"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={nextStep} size="large" className="login-button" block>
                Tiếp tục
              </Button>
            </Form.Item>
          </>
        )}
        {step === 2 && (
          <>
            <Row gutter={[16, 16]}>
              <Col span={24}>
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
              <Col span={24}>
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
              <Col span={24}>
                <Form.Item label="Hoạt động 24/7" name="is24Hours" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
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
                        placeholder="Chọn giờ"
                      />
                    </Form.Item>
                  )}
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
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
                        placeholder="Chọn giờ"
                      />
                    </Form.Item>
                  )}
                </Form.Item>
              </Col>
              <Col span={24}>
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
                <DatePicker format="YYYY-MM-DD" className="w-100" placeholder="Chọn ngày" />
                </Form.Item>
              </Col>
            </Row>

            <Typography.Title level={5} style={{ marginBottom: 12 }}>
              Quy mô & kích thước
            </Typography.Title>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Chiều cao xe tối đa (m)"
                  name="maxVehicleHeight"
                  rules={[{ required: true, message: 'Nhập chiều cao tối đa' }]}
                >
                  <InputNumber min={0} step={0.1} className="w-100" placeholder="VD: 2.5" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Chiều rộng xe tối đa (m)"
                  name="maxVehicleWidth"
                  rules={[{ required: true, message: 'Nhập chiều rộng tối đa' }]}
                >
                  <InputNumber min={0} step={0.1} className="w-100" placeholder="VD: 2" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Sức chứa mỗi tầng"
                  name="totalCapacityEachLevel"
                  rules={[{ required: true, message: 'Nhập sức chứa/tầng' }]}
                >
                  <InputNumber min={1} className="w-100" placeholder="VD: 50" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Tổng số tầng"
                  name="totalLevel"
                  rules={[{ required: true, message: 'Nhập số tầng' }]}
                >
                  <InputNumber min={1} className="w-100" placeholder="VD: 5" />
                </Form.Item>
              </Col>
              <Col span={24}>
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
            <Form.Item
              name="isAgreeToP"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error('Bạn cần đồng ý với điều khoản')),
                },
              ]}
            >
              <Checkbox onChange={(e) => setIsAgreeToP(e.target.checked)}>
                Tôi đã đọc và đồng ý với Chính sách & Điều khoản
              </Checkbox>
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={prevStep} size="large" className="login-button" block>
                Quay lại
              </Button>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                className="login-button"
                block
                loading={loading || isCreatingAddress || isCreatingParkingLot}
               disabled={!isAgreeToP}
              >
                Gửi yêu cầu tạo bãi đỗ
              </Button>
            </Form.Item>
          </>
        )}
      </Form>
    </div>
  )
}

export default RegisterForm
