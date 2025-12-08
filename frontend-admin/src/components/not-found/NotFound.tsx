import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { getUserData } from '../../utils/userData'
export default function NotFound() {
  const navigate = useNavigate()
  const handleBackHome = () => {
    const user = getUserData<{ role?: string }>()
    const role = user?.role?.toLowerCase()
    if (role === 'admin') {
      navigate('/admin/manage-account')
    } else {
      navigate('/operator/parking-lot')
    }
  }

  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Button type="primary" onClick={handleBackHome}>
          Back Home
        </Button>
      }
    />
  )
}
