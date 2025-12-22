export interface Announcement {
  _id: string
  title: string
  content: string
  recipientRoles: string[]
  scheduleAt: string
  type: string
}
