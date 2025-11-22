import { Card, Space, Typography } from 'antd'
import type { ReactNode } from 'react'

const { Text } = Typography

interface StatCardProps {
  title: string
  value: number | string
  suffix?: string
  icon: ReactNode
}

const StatCard: React.FC<StatCardProps> = ({ title, value, suffix, icon }) => (
  <Card className="stat-card">
    <Space size={16} align="start">
      <div className="stat-card__icon">{icon}</div>
      <div>
        <Text type="secondary">{title}</Text>
        <div className="stat-card__value">
          {value}
          {suffix && <span className="stat-card__suffix">{suffix}</span>}
        </div>
      </div>
    </Space>
  </Card>
)

export default StatCard
