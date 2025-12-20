export interface Comment {
  _id: string
  targetId: string
  targetType: string
  parentId: string | null
  content: string
  star: number
  accountId: string
  creatorName: string
  creatorRole: string
  createdAt: string
  replies: Comment[]
}

