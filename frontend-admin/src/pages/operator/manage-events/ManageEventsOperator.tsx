import { getUserData } from "../../../utils/userData"

const ManageEventsOperator: React.FC = () => {
    const userData = getUserData()
    console.log(userData)
  return (
    <div>
      <h1>Manage Events Operator</h1>
    </div>
  )
}

export default ManageEventsOperator     