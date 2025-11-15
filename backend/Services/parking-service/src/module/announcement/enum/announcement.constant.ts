export const ANNOUNCEMENT_STATUSES = [
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'EXPIRED',
  'SENT',
] as const

export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number]
