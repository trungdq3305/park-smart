import React, { useState } from 'react';
import { Button, Input, Form, Typography, notification } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useLoginMutation } from '../../features/auth/authApi';
import Cookies from 'js-cookie';

const { Title, Text } = Typography;

interface LoginFormProps {
  onSwitchToRegister: () => void;
}
interface LoginFormValues {
  email: string;
  password: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [login] = useLoginMutation();

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await login({
        email: values.email || '',
        password: values.password,
      }).unwrap();

      const token = response.data;

      if (token) {
        Cookies.set('userToken', token, { expires: 7 });
        notification.success({
          message: 'Đăng nhập thành công',
          description: 'Chào mừng bạn đến với ParkSmart!'
        });
      } else {
        notification.error({
          message: 'Lỗi phản hồi',
          description: 'Không tìm thấy token trong phản hồi từ server.',
        });
      }
    } catch (error) {
      notification.error({
        message: 'Đăng nhập thất bại',
        description: 'Đã xảy ra lỗi không xác định'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <Title level={2} className="brand-title">ParkSmart</Title>
      <Title level={3} className="welcome-title">Welcome Back!</Title>
      
      <Text className="signup-prompt">
        Want to be an operator? <span onClick={onSwitchToRegister} className="signup-link">Create an operator account now,</span> it's FREE! Takes less than a minute.
      </Text>

      <Form
        form={form}
        name="login"
        onFinish={onFinish}
        layout="vertical"
        className="login-form"
      >
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
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
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
            Login Now
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LoginForm;
