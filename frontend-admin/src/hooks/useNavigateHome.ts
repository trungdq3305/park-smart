import { useNavigate } from 'react-router-dom'
import { getUserData } from '../utils/userData'

type UserRole = 'admin' | 'operator'

const HOME_PATH_BY_ROLE: Record<UserRole, string> = {
  admin: '/admin/manage-account',
  operator: '/operator/parking-lot',
}

/**
 * Custom hook to navigate to home page based on user role
 */
export const useNavigateHome = () => {
  const navigate = useNavigate()

  const getHomePath = (): string => {
    const role = getUserData<{ role?: string }>()?.role?.toLowerCase() as UserRole | undefined

    return HOME_PATH_BY_ROLE[role ?? 'operator']
  }

  const navigateToHome = () => {
    navigate(getHomePath())
  }

  return {
    navigateToHome,
    getHomePath,
  }
}
