import React, { useState } from 'react';
import { Button, Input, Form, Typography, notification } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { useRegisterMutation } from '../../features/auth/authApi';

const { Title, Text } = Typography;

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

interface RegisterFormValues {
  email: string;
  password: string;
  phoneNumber: string;
  fullName: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
const [register] = useRegisterMutation();

  const onFinish = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const registerData = {
        email: values.email ,
        password: values.password,
        phoneNumber: values.phoneNumber.trim(),
        fullName: values.fullName.trim(),
      }
      await register(registerData).unwrap();
      
      notification.success({
        message: 'Đăng ký thành công!',
        description: `Người dùng ${values.fullName} đã tạo tài khoản thành công với email đăng nhập là ${values.email}`,
        duration: 4.5,
      })
      form.resetFields()

    } catch (error: unknown) {
      let errorMessage = 'Đã xảy ra lỗi không xác định';
    
      // Kiểm tra nếu error là một đối tượng có thuộc tính data hoặc message
      if (error && typeof error === 'object') {
        if ('data' in error && error.data && typeof error.data === 'object' && 'message' in error.data) {
          errorMessage = (error.data as { message: string }).message;
        } else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
      }
      notification.error({
        message: 'Đăng ký thất bại',
        description: errorMessage,
        duration: 4.5,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <Title level={2} className="brand-title">ParkSmart</Title>
      <Title level={3} className="welcome-title">Create Operator Account</Title>
      
      <Text className="signup-prompt">
        Already have an account? <span onClick={onSwitchToLogin} className="signup-link">Sign in here</span>
      </Text>

      <Form
        form={form}
        name="register"
        onFinish={onFinish}
        layout="vertical"
        className="login-form"
      >
        <Form.Item
          name="fullName"
          rules={[{ required: true, message: 'Please input your full name!' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Full Name"
            size="large"
            className="login-input"
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' }
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
            placeholder="Phone Number"
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
      message: 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt!',
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
            { required: true, message: 'Please confirm your password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match!'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Confirm Password"
            size="large"
            className="login-input"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            className="login-button"
            block
          >
            Create Account
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RegisterForm;
