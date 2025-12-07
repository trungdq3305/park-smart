export interface OperatorInvoice {
  id: string
  paymentType: string
  invoiceMonth: string
  relatedInvoiceId: string | null
  reservationId: string | null
  subscriptionId: string
  parkingLotSessionId: string | null
  operatorId: string
  xenditInvoiceId: string
  externalId: string
  amount: number
  currency: string
  status: string
  xenditUserId: string
  checkoutUrl: string
  createdBy: string
  dueDate: string
  createdAt: string
  updatedAt: string
  paidAt: string | null
  refundedAt: string | null
}
