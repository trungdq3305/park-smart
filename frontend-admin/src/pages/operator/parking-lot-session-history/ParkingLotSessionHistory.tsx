import { useGetParkingSessionHistoryQuery } from "../../../features/operator/parkingSessionAPI"
interface ParkingLotSessionHistoryResponse{
    
}
const ParkingLotSessionHistory: React.FC = () => {
  const { data, isLoading } = useGetParkingSessionHistoryQuery({
    parkingLotId: '123',
    params: { page: 1, pageSize: 10 },
  })
  return <div>
    <p>Parking Lot Sesson History</p>
  </div>
}

export default ParkingLotSessionHistory