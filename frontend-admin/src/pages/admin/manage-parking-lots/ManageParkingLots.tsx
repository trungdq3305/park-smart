import { useGetParkingLotsAdminQuery } from '../../../features/admin/parkinglotAPI'
import type { Pagination } from '../../../types/Pagination'
import type { ParkingLot } from '../../../types/ParkingLot'
interface ParkingLotsListResponse {
  data: {
    data: ParkingLot[]
    pagination: Pagination
  }
  isLoading: boolean
}
const ManageParkingLots: React.FC = () => {
  const { data } = useGetParkingLotsAdminQuery<ParkingLotsListResponse>({
    status: 'APPROVED',
    page: 1,
    pageSize: 10,
  })
  const parkingLots = data?.data || []
  console.log(parkingLots)
  return (
    <div>
      <h1>Manage Parking Lots</h1>
    </div>
  )
}

export default ManageParkingLots
