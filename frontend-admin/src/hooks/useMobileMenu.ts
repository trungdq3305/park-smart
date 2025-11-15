import { useState, useEffect, useCallback, useMemo } from 'react'

/**
 * Custom hook để detect mobile device và quản lý mobile menu state
 */
export const useMobileMenu = (): {
  isMobile: boolean
  mobileMenuOpen: boolean
  windowWidth: number
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
  openMobileMenu: () => void
} => {
  const [windowWidth, setWindowWidth] = useState(() => {
    // Initialize với giá trị từ window nếu có
    if (typeof window !== 'undefined') {
      return window.innerWidth
    }
    return 1024 // Default desktop width
  })

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Use useMemo để tính toán isMobile từ windowWidth
  const isMobile = useMemo(() => {
    return windowWidth <= 768
  }, [windowWidth])

  // Effect để listen window resize events
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    // Add resize listener
    window.addEventListener('resize', handleResize)

    // Cleanup listener khi unmount
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-close mobile menu khi chuyển từ mobile sang desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false)
    }
  }, [isMobile])

  // Memoized handlers để prevent unnecessary re-renders
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  const openMobileMenu = useCallback(() => {
    setMobileMenuOpen(true)
  }, [])

  return {
    isMobile,
    mobileMenuOpen,
    windowWidth, // Expose windowWidth nếu cần
    toggleMobileMenu,
    closeMobileMenu,
    openMobileMenu,
  }
}
