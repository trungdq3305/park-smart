import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import type { BreadcrumbProps } from 'antd'

export const useBreadcrumb = (): BreadcrumbProps['items'] => {
  const location = useLocation()

  const breadcrumbItems = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    
    // Base breadcrumb items
    const items: BreadcrumbProps['items'] = []
    
    // Add home/dashboard as first item
    if (pathSegments.length > 0) {
      items.push({
        title: 'Dashboard',
        href: '/admin'
      })
    }

    // Map path segments to breadcrumb items
    pathSegments.forEach((segment, index) => {
      const isLast = index === pathSegments.length - 1
      
      switch (segment) {
        case 'admin':
          // Skip admin segment as it's handled above
          break
        case 'parking-lots':
          items.push({
            title: 'Parking Lots',
            href: isLast ? undefined : '/admin/parking-lots'
          })
          break
        case 'analytics':
          items.push({
            title: 'Analytics',
            href: isLast ? undefined : '/admin/analytics'
          })
          break
        case 'reports':
          items.push({
            title: 'Reports',
            href: isLast ? undefined : '/admin/reports'
          })
          break
        case 'users':
          items.push({
            title: 'Users',
            href: isLast ? undefined : '/admin/users'
          })
          break
        default:
          // For dynamic segments (like IDs), use the segment as title
          items.push({
            title: segment.charAt(0).toUpperCase() + segment.slice(1),
            href: isLast ? undefined : `/${pathSegments.slice(0, index + 1).join('/')}`
          })
      }
    })

    return items
  }, [location.pathname])

  return breadcrumbItems
}
