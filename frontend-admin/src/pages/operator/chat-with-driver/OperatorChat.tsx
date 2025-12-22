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
import { getUserData } from '../../../utils/userData'
import './OperatorChat.css'

type Room = {
  id: string // = peerId (giữ nguyên để hiển thị)
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
  const user = getUserData<{ id?: string; fullName?: string; role: string }>()
  const currentUserId = user?.id || ''
  const currentUserName = user?.fullName || 'Operator'

  const [rooms, setRooms] = useState<Room[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [search, setSearch] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const getRoomId = (uid1: string, uid2: string) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`
  }

  // Lấy danh sách phòng chat
  useEffect(() => {
    if (!currentUserId) return

    setIsLoadingRooms(true)
    const q = query(
      collection(db, 'chatRooms', currentUserId, 'rooms'),
      orderBy('updatedAt', 'desc')
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Room[] = snap.docs.map((d) => {
          const data: any = d.data()
          return {
            id: d.id, // id vẫn là peerId (giữ nguyên để hiển thị)
            peerId: data.peerId || '',
            peerName: data.peerName || 'Driver',
            lastMessage: data.lastMessage || '',
            updatedAt: data.updatedAt?.toDate?.() ?? null,
            unreadCount: data.unreadCount ?? 0,
          }
        })
        setRooms(list)
        setIsLoadingRooms(false)

        if (!activeRoomId && list.length > 0) {
          setActiveRoomId(list[0].id)
        }
      },
      (err) => {
        console.error('Error fetching rooms:', err)
        setIsLoadingRooms(false)
      }
    )

    return () => unsub()
  }, [currentUserId])

  // Lấy tin nhắn cho phòng đang chọn
  useEffect(() => {
    if (!activeRoomId) {
      setMessages([])
      return
    }

    setIsLoadingMessages(true)
    const roomId = getRoomId(currentUserId, activeRoomId)
    const q = query(
      collection(db, 'messages', roomId, 'items'),
      orderBy('timestamp', 'asc')
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const msgs: Message[] = snap.docs.map((d) => {
          const data: any = d.data()
          return {
            id: d.id,
            text: data.text || '',
            senderId: data.senderId || '',
            receiverId: data.receiverId || '',
            timestamp: data.timestamp?.toDate?.() ?? null,
          }
        })
        setMessages(msgs)
        setIsLoadingMessages(false)
      },
      (err) => {
        console.error('Error fetching messages:', err)
        setIsLoadingMessages(false)
      }
    )

    // Reset unread count
    updateDoc(doc(db, 'chatRooms', currentUserId, 'rooms', activeRoomId), {
      unreadCount: 0,
    }).catch((e) => console.error('Failed to reset unread count:', e))

    return () => unsub()
  }, [activeRoomId, currentUserId])

  // Scroll xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      const roomId = getRoomId(currentUserId, activeRoom.peerId)

      // Gửi tin nhắn
      await addDoc(collection(db, 'messages', roomId, 'items'), {
        text,
        senderId: currentUserId,
        receiverId: activeRoom.peerId,
        timestamp: now,
        seen: false,
      })

      // Cập nhật room cho operator
      await setDoc(
        doc(db, 'chatRooms', currentUserId, 'rooms', activeRoom.id),
        {
          lastMessage: text,
          updatedAt: now,
          unreadCount: 0,
        },
        { merge: true }
      )

      // Cập nhật room cho driver
      if (activeRoom.peerId) {
        await setDoc(
          doc(db, 'chatRooms', activeRoom.peerId, 'rooms', roomId), // ← SỬA Ở ĐÂY
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
          {/* Sidebar */}
          <aside className="op-chat-sidebar">
            <div className="op-chat-search">
              <input
                type="text"
                className="op-chat-search-input"
                placeholder="Tìm theo tên tài xế hoặc ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="op-chat-list">
              {isLoadingRooms ? (
                <div className="op-chat-loading">Đang tải danh sách phòng...</div>
              ) : filteredRooms.length === 0 ? (
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
                  {isLoadingMessages ? (
                    <div className="op-chat-window-empty">Đang tải tin nhắn...</div>
                  ) : messages.length === 0 ? (
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
                      if (e.key === 'Enter' && !e.shiftKey && !isSending) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    disabled={isSending}
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
                {isLoadingRooms
                  ? 'Đang tải...'
                  : 'Chọn một cuộc trò chuyện ở bên trái để bắt đầu nhắn tin.'}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default OperatorChat