import React, { useState } from 'react'
import { MessageOutlined, UserOutlined, StarOutlined, SendOutlined } from '@ant-design/icons'
import type { Comment } from '../../types/Comment'
import '../../pages/operator/parking-lot/ParkingLot.css'

interface CommentListProps {
  comments: Comment[]
  loading: boolean
  onReply?: (comment: Comment, replyContent: string) => Promise<void>
  isReplying?: boolean
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  // Display the exact UTC time from response without timezone conversion
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear()
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${day}/${month}/${year}, ${hours}:${minutes}`
}

const renderStars = (rating: number): React.ReactElement => {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <StarOutlined
        key={i}
        className={i <= rating ? 'comment-star-filled' : 'comment-star-empty'}
      />
    )
  }
  return <div className="comment-stars">{stars}</div>
}

const CommentList: React.FC<CommentListProps> = ({ comments, loading, onReply, isReplying = false }) => {
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({})

  const handleReplyClick = (commentId: string) => {
    setReplyingToId(replyingToId === commentId ? null : commentId)
    if (!replyContent[commentId]) {
      setReplyContent({ ...replyContent, [commentId]: '' })
    }
  }

  const handleReplySubmit = async (comment: Comment) => {
    const content = replyContent[comment._id]?.trim()
    if (!content || !onReply) return

    try {
      await onReply(comment, content)
      setReplyContent({ ...replyContent, [comment._id]: '' })
      setReplyingToId(null)
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const handleCancelReply = (commentId: string) => {
    setReplyingToId(null)
    setReplyContent({ ...replyContent, [commentId]: '' })
  }
  if (loading) {
    return (
      <div className="pricing-policy-section">
        <div className="pricing-policy-header">
          <div className="pricing-policy-title-section">
            <MessageOutlined className="pricing-policy-title-icon" />
            <h2 className="pricing-policy-title">Đánh giá và bình luận</h2>
          </div>
        </div>
        <div className="pricing-policy-loading">
          <div className="pricing-policy-loading-spinner" />
          <p>Đang tải đánh giá...</p>
        </div>
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div className="pricing-policy-section">
        <div className="pricing-policy-header">
          <div className="pricing-policy-title-section">
            <MessageOutlined className="pricing-policy-title-icon" />
            <h2 className="pricing-policy-title">Đánh giá và bình luận</h2>
          </div>
        </div>
        <div className="pricing-policy-empty">
          <MessageOutlined className="pricing-policy-empty-icon" />
          <p>Chưa có đánh giá nào</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pricing-policy-section">
      <div className="pricing-policy-header">
        <div className="pricing-policy-title-section">
          <MessageOutlined className="pricing-policy-title-icon" />
          <h2 className="pricing-policy-title">Đánh giá và bình luận</h2>
          <span className="pricing-policy-count">({comments.length})</span>
        </div>
      </div>

      <div className="comment-list">
        {comments.map((comment) => (
          <div key={comment._id} className="comment-item">
            <div className="comment-header">
              <div className="comment-user-info">
                <div className="comment-avatar">
                  <UserOutlined />
                </div>
            <div className="comment-user-details">
              <div className="comment-user-name">
                {comment.creatorName || 'Người dùng ẩn danh'}
              </div>
              <div className="comment-date">{formatDate(comment.createdAt)}</div>
            </div>
          </div>
          {comment.star && (
            <div className="comment-rating">
              {renderStars(comment.star)}
              <span className="comment-rating-value">{comment.star}/5</span>
            </div>
          )}
            </div>
            {comment.content && (
              <div className="comment-content">
                <p>{comment.content}</p>
              </div>
            )}

            {/* Reply Section */}
            {onReply && (
              <div className="comment-actions">
                <button
                  className="comment-reply-btn"
                  onClick={() => handleReplyClick(comment._id)}
                  disabled={isReplying}
                >
                  <MessageOutlined />
                  <span>Trả lời</span>
                </button>
              </div>
            )}

            {/* Reply Form */}
            {onReply && replyingToId === comment._id && (
              <div className="comment-reply-form">
                <textarea
                  className="comment-reply-input"
                  placeholder="Nhập phản hồi của bạn..."
                  value={replyContent[comment._id] || ''}
                  onChange={(e) =>
                    setReplyContent({ ...replyContent, [comment._id]: e.target.value })
                  }
                  rows={3}
                />
                <div className="comment-reply-actions">
                  <button
                    className="comment-reply-cancel-btn"
                    onClick={() => handleCancelReply(comment._id)}
                    disabled={isReplying}
                  >
                    Hủy
                  </button>
                  <button
                    className="comment-reply-submit-btn"
                    onClick={() => handleReplySubmit(comment)}
                    disabled={isReplying || !replyContent[comment._id]?.trim()}
                  >
                    <SendOutlined />
                    <span>{isReplying ? 'Đang gửi...' : 'Gửi phản hồi'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="comment-replies">
                {comment.replies.map((reply) => (
                  <div key={reply._id} className="comment-reply-item">
                    <div className="comment-reply-header">
                      <div className="comment-user-info">
                        <div className="comment-avatar comment-avatar-small">
                          <UserOutlined />
                        </div>
                        <div className="comment-user-details">
                          <div className="comment-user-name">
                            {reply.creatorName || 'Người dùng ẩn danh'}
                          </div>
                          <div className="comment-date">{formatDate(reply.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                    {reply.content && (
                      <div className="comment-content">
                        <p>{reply.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CommentList

