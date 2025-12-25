import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import './OperatorChat.css'
import { useOperatorId } from '../../../hooks/useOperatorId'

type Room = {
  id: string //=peerId
  peerId: string
  peerName: string
  lastMessage: string
  updatedAt?: Date | null
  unreadCount: number
}

type Message = {
  id: string
  text: string
  senderId: string
  receiverId: string
  timestamp?: Date | null
}

const OperatorChat: React.FC = () => {
  const user = useOperatorId()
  const currentUserId = user
  const currentUserName = 'Operator'
console.log(currentUserId)
  const [rooms, setRooms] = useState<Room[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [search, setSearch] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Lấy danh sách phòng chat từ Firestore theo user hiện tại
  useEffect(() => {
    if (!currentUserId) return

    const q = query(
      collection(db, 'chatRooms', currentUserId, 'rooms'),
      orderBy('updatedAt', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      const list: Room[] = snap.docs.map((d) => {
        const data: any = d.data()
        return {
          id: d.id, //  roomId = peerId
          peerId: data.peerId || '',
          peerName: data.peerName || 'Driver',
          lastMessage: data.lastMessage || '',
          updatedAt: data.updatedAt?.toDate?.() ?? null,
          unreadCount: data.unreadCount ?? 0,
        }
      })

      setRooms(list)
      if (!activeRoomId && list.length > 0) {
        setActiveRoomId(list[0].id)
      }
    })

    return () => unsub()
  }, [currentUserId])

  // Lấy danh sách tin nhắn cho phòng đang chọn
  useEffect(() => {
    if (!activeRoomId) {
      setMessages([])
      return
    }

    const q = query(
      collection(db, 'messages', activeRoomId, 'items'), // ✅ ĐÚNG như Flutter
      orderBy('timestamp', 'asc')
    )

    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => {
          const data: any = d.data()
          return {
            id: d.id,
            text: data.text || '',
            senderId: data.senderId || '',
            receiverId: data.receiverId || '',
            timestamp: data.timestamp?.toDate?.() ?? null,
          }
        })
      )
    })

    // reset unread
    updateDoc(
      doc(db, 'chatRooms', currentUserId, 'rooms', activeRoomId),
      { unreadCount: 0 }
    ).catch(() => {})

    return () => unsub()
  }, [activeRoomId, currentUserId])

  // Scroll xuống cuối khi có tin nhắn mới hoặc đổi phòng
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeRoomId])

  const filteredRooms = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return rooms
    return rooms.filter(
      (r) => r.peerName.toLowerCase().includes(keyword) || r.id.toLowerCase().includes(keyword)
    )
  }, [rooms, search])

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) || null,
    [rooms, activeRoomId]
  )

  const handleSelectRoom = (roomId: string) => {
    setActiveRoomId(roomId)
  }

  const handleSend = async () => {
    const text = messageInput.trim()
    if (!text || !currentUserId || !activeRoom) return

    setIsSending(true)
    try {
      const now = serverTimestamp()

      // ghi message vào collection chung
      await addDoc(collection(db, 'messages', activeRoom.id, 'items'), {
        text,
        senderId: currentUserId,
        receiverId: activeRoom.peerId,
        timestamp: now,
        seen: false,
      })

      // cập nhật room cho operator
      await setDoc(
        doc(db, 'chatRooms', currentUserId, 'rooms', activeRoom.id),
        {
          lastMessage: text,
          updatedAt: now,
          unreadCount: 0,
        },
        { merge: true }
      )

      // cập nhật room cho driver (tăng unreadCount)
      if (activeRoom.peerId) {
        await setDoc(
          doc(db, 'chatRooms', activeRoom.peerId, 'rooms', activeRoom.id),
          {
            peerId: currentUserId,
            peerName: currentUserName,
            lastMessage: text,
            updatedAt: now,
            unreadCount: increment(1),
          },
          { merge: true }
        )
      }

      setMessageInput('')
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error sending message:', e)
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (date?: Date | null) => {
    if (!date) return ''
    const hh = date.getHours().toString().padStart(2, '0')
    const mm = date.getMinutes().toString().padStart(2, '0')
    return `${hh}:${mm}`
  }

  if (!currentUserId) {
    return (
      <div className="op-chat-page">
        <div className="op-chat-card">
          <p>Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="op-chat-page">
      <div className="op-chat-card">
        <header className="op-chat-header">
          <div>
            <h2 className="op-chat-title">Trò chuyện với tài xế</h2>
            <p className="op-chat-subtitle">
              Danh sách cuộc trò chuyện của bạn với tài xế, dữ liệu đồng bộ qua Firebase.
            </p>
          </div>
        </header>

        <div className="op-chat-body">
          {/* Sidebar: danh sách phòng */}
          <aside className="op-chat-sidebar">
            <div className="op-chat-search">
              <input
                type="text"
                className="op-chat-search-input"
                placeholder="Tìm theo tên tài xế..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="op-chat-list">
              {filteredRooms.length === 0 ? (
                <div className="op-chat-empty">Chưa có cuộc trò chuyện nào.</div>
              ) : (
                filteredRooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    className={`op-chat-list-item ${
                      room.id === activeRoomId ? 'op-chat-list-item-active' : ''
                    }`}
                    onClick={() => handleSelectRoom(room.id)}
                  >
                    <div className="op-chat-avatar">{room.peerName.charAt(0) || 'D'}</div>
                    <div className="op-chat-list-main">
                      <div className="op-chat-list-top">
                        <span className="op-chat-name">{room.peerName}</span>
                        <span className="op-chat-time">{formatTime(room.updatedAt)}</span>
                      </div>
                      <div className="op-chat-list-bottom">
                        <span className="op-chat-last">{room.lastMessage}</span>
                      </div>
                    </div>
                    {room.unreadCount > 0 && (
                      <div className="op-chat-unread">{room.unreadCount}</div>
                    )}
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Khung chat */}
          <section className="op-chat-window">
            {activeRoom ? (
              <>
                <div className="op-chat-window-header">
                  <div className="op-chat-avatar op-chat-avatar-large">
                    {activeRoom.peerName.charAt(0) || 'D'}
                  </div>
                  <div>
                    <div className="op-chat-window-name">{activeRoom.peerName}</div>
                    <div className="op-chat-window-meta">ID: {activeRoom.peerId}</div>
                  </div>
                </div>

                <div className="op-chat-messages">
                  {messages.length === 0 ? (
                    <div className="op-chat-window-empty">Hãy bắt đầu cuộc trò chuyện...</div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId === currentUserId
                      return (
                        <div
                          key={m.id}
                          className={`op-chat-message ${
                            isMe ? 'op-chat-message-me' : 'op-chat-message-peer'
                          }`}
                        >
                          <div className="op-chat-bubble">{m.text}</div>
                          <span className="op-chat-message-time">{formatTime(m.timestamp)}</span>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="op-chat-input-bar">
                  <input
                    type="text"
                    className="op-chat-input"
                    placeholder="Nhập tin nhắn..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="op-chat-send-btn"
                    onClick={handleSend}
                    disabled={!messageInput.trim() || isSending}
                  >
                    Gửi
                  </button>
                </div>
              </>
            ) : (
              <div className="op-chat-window-empty">
                Chọn một cuộc trò chuyện ở bên trái để bắt đầu nhắn tin với tài xế.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
export default OperatorChat