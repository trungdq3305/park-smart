import { useState, useEffect } from 'react'

const STORAGE_KEY = 'PARKING_PYTHON_GATEWAY_URL'
const DEFAULT_URL = 'http://localhost:1836' // Mặc định cho máy chạy song song

export const useLocalGateway = () => {
  const [gatewayUrl, setGatewayUrl] = useState<string>(DEFAULT_URL)

  // Khi component mount, đọc từ LocalStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem(STORAGE_KEY)
    if (savedUrl) {
      setGatewayUrl(savedUrl)
    }
  }, [])

  const saveGatewayUrl = (url: string) => {
    // Xóa dấu gạch chéo cuối nếu có
    const cleanedUrl = url.replace(/\/$/, '')
    localStorage.setItem(STORAGE_KEY, cleanedUrl)
    setGatewayUrl(cleanedUrl)
    // Reload trang để áp dụng socket mới
    window.location.reload()
  }

  return { gatewayUrl, saveGatewayUrl }
}

