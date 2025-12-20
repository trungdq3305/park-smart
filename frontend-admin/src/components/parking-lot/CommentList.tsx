import React from 'react'
import { MessageOutlined, UserOutlined, StarOutlined } from '@ant-design/icons'
import type { Comment } from '../../types/Comment'
import '../../pages/operator/parking-lot/ParkingLot.css'

interface CommentListProps {
  comments: Comment[]
  loading: boolean
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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

const CommentList: React.FC<CommentListProps> = ({ comments, loading }) => {
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
          </div>
        ))}
      </div>
    </div>
  )
}

export default CommentList

