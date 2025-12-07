import React from 'react'
import type { ParkingLotSession } from '../../types/ParkingLotSession'
import SessionItem from './SessionItem'
import './SessionList.css'

interface SessionListProps {
  sessions: ParkingLotSession[]
  onViewDetails: (sessionId: string, session: ParkingLotSession) => void
}

const SessionList: React.FC<SessionListProps> = ({ sessions, onViewDetails }) => {
  return (
    <div className="session-list">
      {sessions.map((session) => (
        <SessionItem key={session._id} session={session} onViewDetails={onViewDetails} />
      ))}
    </div>
  )
}

export default SessionList
