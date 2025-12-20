export interface FAQ {
  _id: string
  question: string
  answer: string
  creatorName: string
  creatorRole: string
  createdAt: string
  updatedAt?: string | null
  accountId?: string
  faqStatusId?: string
}
