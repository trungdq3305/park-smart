import React, { useEffect, useState } from 'react'
import { Typography } from 'antd'
import './LoginPage.css'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import { useNavigate } from 'react-router-dom'
import { getUserData } from '../../utils/userData'
import logoImg from '../../assets/logo.jpg'
import loginBg from '../../assets/login.jpg'

const { Title, Text } = Typography

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const toggleMode = () => {
    setIsLogin(!isLogin)
  }
  //check if user is logged in
  useEffect(() => {
    const userData = getUserData()
    const role = userData?.role?.toLowerCase()
    if (userData) {
      if (role === 'admin') {
        navigate('/admin/manage-account')
      } else {
        navigate('/operator/parking-lot')
      }
    }
  }, [navigate])
  return (
    <div className="login-container">
      {/* Left Promotional Section */}
      <div
        className="promotional-section"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(22,163,74,0.9), rgba(5,150,105,0.85)), url(${loginBg})`,
        }}
      >
        <div className="promotional-content">
          <img src={logoImg} alt="ParkSmart logo" className="promotional-logo" />
          <Title level={1} className="promotional-title">
            ParkSmart
          </Title>
          <Text className="promotional-description">
            Nền tảng quản lý bãi đỗ xe thông minh dành cho chủ bãi đỗ xe.
          </Text>
          <Text className="copyright">© 2025 ParkSmart. All rights reserved.</Text>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="login-form-section">
        {isLogin ? (
          <LoginForm onSwitchToRegister={toggleMode} />
        ) : (
          <RegisterForm onSwitchToLogin={toggleMode} />
        )}
      </div>
    </div>
  )
}

export default Login
