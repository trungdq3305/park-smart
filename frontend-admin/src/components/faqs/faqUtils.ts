import type { FAQ } from '../../types/FAQs'
import type { FAQFilter } from './faqTypes'

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const normalizeRole = (role?: string) => role || ''

export const getStatusLabel = (role?: string): string => {
  const r = normalizeRole(role)
  if (r.includes('Admin')) return 'Admin'
  if (r.includes('Operator')) return 'Operator'
  return 'Khác'
}

export const getStatusClass = (role?: string): string => {
  const r = normalizeRole(role)
  if (r.includes('Admin')) return 'faq-status-admin'
  if (r.includes('Operator')) return 'faq-status-operator'
  return 'faq-status-other'
}

export const getFilterLabel = (filter: FAQFilter): string => {
  switch (filter) {
    case 'Admin':
      return 'Admin tạo'
    case 'Operator':
      return 'Operator tạo'
    default:
      return 'Tất cả'
  }
}

export const filterFAQs = (faqs: FAQ[], filter: FAQFilter): FAQ[] => {
  if (filter === 'all') return faqs
  return faqs.filter((faq) => {
    const r = normalizeRole(faq.creatorRole)
    if (filter === 'Admin') return r.includes('Admin')
    if (filter === 'Operator') return r.includes('Operator')
    return !r.includes('Admin') && !r.includes('Operator')
  })
}

export const calculateFAQStats = (faqs: FAQ[]) => {
  const total = faqs.length
  let admin = 0
  let operator = 0

  faqs.forEach((faq) => {
    const r = normalizeRole(faq.creatorRole)
    if (r.includes('Admin')) admin += 1
    else if (r.includes('Operator')) operator += 1
  })

  return { total, admin, operator }
}

