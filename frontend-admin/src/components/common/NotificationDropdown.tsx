import React from 'react'
import { Dropdown, Button, Badge } from 'antd'
import { BellOutlined } from '@ant-design/icons'

interface NotificationDropdownProps {
  isMobile?: boolean
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isMobile = false }) => {
  const [open, setOpen] = React.useState(false)
  const [unreadCount, setUnreadCount] = React.useState(3)

  const notifications = [
    { key: 'n1', title: 'New booking created', time: '2 mins ago' },
    { key: 'n2', title: 'Payment received', time: '10 mins ago' },
    { key: 'n3', title: 'Lot A reached 80% capacity', time: '30 mins ago' },
  ]

  const items = notifications.map((n) => ({
    key: n.key,
    label: (
      <div className="notification-item">
        <div className="notification-item-title">{n.title}</div>
        <div className="notification-item-time">{n.time}</div>
      </div>
    ),
  }))

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen && unreadCount > 0) setUnreadCount(0)
  }

  return (
    <Dropdown
      menu={{ items }}
      trigger={['click']}
      placement="bottomRight"
      onOpenChange={handleOpenChange}
      open={open}
    >
      <Button type="text" className="header-action-btn notification-btn" aria-label="Notifications">
        <Badge count={unreadCount} size="small" offset={[isMobile ? -2 : 0, 2]}>
          <BellOutlined />
        </Badge>
      </Button>
    </Dropdown>
  )
}

export default NotificationDropdown
