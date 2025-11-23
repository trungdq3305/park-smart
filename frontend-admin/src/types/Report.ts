import type { ReportCategory } from './ReportCategory'

export interface Report {
  _id: string
  driverId: string
  operatorInfo: OperatorInfo
  parkingLotId: string
  category: ReportCategory
  isProcessed: boolean
  reason: string
  response: string
  createdAt: string
  updatedAt: string
}
export interface OperatorInfo {
  _id: string
  name: string
}
