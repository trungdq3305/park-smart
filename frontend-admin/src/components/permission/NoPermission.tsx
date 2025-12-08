import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { getUserData } from '../../utils/userData'

const NoPermission = () => {
  const user = getUserData<{ role?: string }>()
  const navigate = useNavigate()

  const handleBackHome = () => {
    const role = user?.role?.toLowerCase()
    if (role === 'admin') {
      navigate('/admin/manage-account')
    } else {
      navigate('/operator/parking-lot')
    }
  }

  return (
    <Result
      status="403"
      title="403"
      subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
      extra={
        <Button type="primary" onClick={handleBackHome}>
          Trở về trang chủ
        </Button>
      }
    />
  )
}

export default NoPermission
