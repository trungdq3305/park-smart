    import React, { useState } from 'react';
    import { Button, Input, Form, Typography, notification } from 'antd';
    import { UserOutlined, LockOutlined } from '@ant-design/icons';
    import './LoginPage.css';
    import { useLoginMutation } from '../../features/auth/authApi';
    import Cookies from 'js-cookie';
import Link from 'antd/es/typography/Link';
    const { Title, Text } = Typography;

    const Login: React.FC = () => {
        const [form] = Form.useForm();
        const [loading, setLoading] = useState(false);
        const [login] = useLoginMutation()

        const onFinish = async (values: {email: string, password: string}) => {
            setLoading(true);
            try {
                const response = await login({
                email: values.email || '',
                password: values.password,
                }).unwrap()
        
                const token = response.data
        
                if (token) {
                Cookies.set('userToken', token, { expires: 7 })
                } else {
                notification.error({
                    message: 'Lỗi phản hồi',
                    description: 'Không tìm thấy token trong phản hồi từ server.',
                })
                }
            }catch (error) {
                notification.error({
                message: 'Đăng nhập thất bại',
                description: 'Đã xảy ra lỗi không xác định'
                })
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="login-container">
                {/* Left Promotional Section */}
                <div className="promotional-section">
                    <div className="promotional-content">
                        <div className="star-icon">⭐</div>
                        <Title level={1} className="promotional-title">
                            Hello ParkSmart! 👋
                        </Title>
                        <Text className="promotional-description">
                            Skip repetitive and manual parking management tasks. Get highly productive through automation and save tons of time!
                        </Text>
                        <Text className="copyright">
                            © 2024 ParkSmart. All rights reserved.
                        </Text>
                    </div>
                    <div className="geometric-patterns">
                        <div className="pattern pattern-1"></div>
                        <div className="pattern pattern-2"></div>
                        <div className="pattern pattern-3"></div>
                    </div>
                </div>

                {/* Right Login Form Section */}
                <div className="login-form-section">
                    <div className="login-form-container">
                        <Title level={2} className="brand-title">ParkSmart</Title>
                        <Title level={3} className="welcome-title">Welcome Back!</Title>
                        
                        <Text className="signup-prompt">
                        Want to be an operator? <Link href="#" className="signup-link">Create an operator account now,</Link> it's FREE! Takes less than a minute.
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
                </div>
            </div>
        );
    };

    export default Login;