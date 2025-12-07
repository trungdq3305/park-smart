import { useAccountDetailsQuery } from '../features/admin/accountAPI'
import { getUserData } from '../utils/userData'

/**
 * Custom hook để lấy thông tin operator details
 * Tự động lấy operatorId từ userData và fetch operator details
 *
 * @returns {Object} - Object chứa operator, operatorId, và operatorDetails query result
 */
export const useOperatorId = (): string => {
  const operator = getUserData()
  const operatorId = operator?.id || ''
  const operatorDetailsQuery = useAccountDetailsQuery(operatorId, {
    skip: !operatorId, // Skip query nếu không có operatorId
  })

  return operatorDetailsQuery.data?.data?.operatorDetail?._id || ''
}
