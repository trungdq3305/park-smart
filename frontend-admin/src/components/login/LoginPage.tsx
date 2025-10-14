import React, { useEffect, useState } from 'react'
import { Typography } from 'antd'
import './LoginPage.css'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'

const { Title, Text } = Typography

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const toggleMode = () => {
    setIsLogin(!isLogin)
  }
  //check if user is logged in
  useEffect(() => {
    const userData = Cookies.get('userData') ? JSON.parse(Cookies.get('userData') as string) : null
    if (userData) {
      navigate('/')
    }
  }, [navigate])
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
            Skip repetitive and manual parking management tasks. Get highly productive through
            automation and save tons of time!
          </Text>
          <Text className="copyright">© 2024 ParkSmart. All rights reserved.</Text>
        </div>
        <div className="geometric-patterns">
          <div className="pattern pattern-1"></div>
          <div className="pattern pattern-2"></div>
          <div className="pattern pattern-3"></div>
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
