export const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    ACTIVE: 'Đang hoạt động',
    INACTIVE: 'Không hoạt động',
    LOST: 'Bị mất',
    DAMAGED: 'Bị hỏng',
    LOCKED: 'Đã khóa',
  }
  return statusMap[status] || status
}

export const getStatusClass = (status: string): string => {
  if (status === 'ACTIVE') return 'guest-card-status-active'
  if (status === 'INACTIVE') return 'guest-card-status-inactive'
  if (status === 'LOST') return 'guest-card-status-lost'
  if (status === 'DAMAGED') return 'guest-card-status-damaged'
  if (status === 'LOCKED') return 'guest-card-status-locked'
  return 'guest-card-status-pending'
}

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const getCardGradient = (index: number): string => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  ]
  return gradients[index % gradients.length]
}

