import React, { useState } from 'react';
import { Button, Input, Form, Typography, notification } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // TODO: Implement register API call
      console.log('Register data:', values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      notification.success({
        message: 'Đăng ký thành công',
        description: 'Tài khoản operator đã được tạo!'
      });
      
      // Switch back to login form
      onSwitchToLogin();
      form.resetFields();
    } catch (error) {
      notification.error({
        message: 'Đăng ký thất bại',
        description: 'Đã xảy ra lỗi không xác định'
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
          rules={[{ required: true, message: 'Please input your phone number!' }]}
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
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
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
