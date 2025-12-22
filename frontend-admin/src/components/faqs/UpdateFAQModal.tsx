import { useEffect, useState } from 'react'
import { message } from 'antd'
import { useUpdateFAQMutation } from '../../features/admin/FAQsAPI'
import { CustomModal } from '../common'
import type { FAQ } from '../../types/FAQs'
import '../promotions/CreatePromotionModal.css'

interface UpdateFAQModalProps {
  open: boolean
  onClose: () => void
  faq: FAQ | null
}

interface FormData {
  question: string
  answer: string
}

interface FormErrors {
  question?: string
  answer?: string
}

const UpdateFAQModal: React.FC<UpdateFAQModalProps> = ({ open, onClose, faq }) => {
  const [updateFAQ, { isLoading }] = useUpdateFAQMutation()

  const [formData, setFormData] = useState<FormData>({
    question: '',
    answer: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open && faq) {
      setFormData({
        question: faq.question || '',
        answer: faq.answer || '',
      })
      setErrors({})
    }
  }, [open, faq])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.question.trim()) {
      newErrors.question = 'Vui lòng nhập câu hỏi'
    }

    if (!formData.answer.trim()) {
      newErrors.answer = 'Vui lòng nhập câu trả lời'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!faq?._id) {
      message.error('Không tìm thấy thông tin FAQ')
      return
    }

    if (!validateForm()) {
      return
    }

    try {
      const faqData = {
        id: faq._id,
        question: formData.question.trim(),
        answer: formData.answer.trim(),
      }

      await updateFAQ(faqData).unwrap()
      message.success('Cập nhật FAQ thành công')
      onClose()
    } catch (error: any) {
      message.error(error?.data?.message || 'Cập nhật FAQ thất bại')
    }
  }

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Chỉnh sửa FAQ"
      width={600}
      loading={isLoading}
      footer={
        <div className="create-promotion-modal-footer">
          <button
            type="button"
            className="create-promotion-btn create-promotion-btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="button"
            className="create-promotion-btn create-promotion-btn-submit"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
          </button>
        </div>
      }
    >
      <div className="create-promotion-form">
        {/* Question */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Câu hỏi <span className="create-promotion-required">*</span>
          </label>
          <input
            type="text"
            className={`create-promotion-input ${errors.question ? 'error' : ''}`}
            placeholder="Nhập câu hỏi"
            value={formData.question}
            onChange={(e) => {
              setFormData({ ...formData, question: e.target.value })
              if (errors.question) setErrors({ ...errors, question: undefined })
            }}
          />
          {errors.question && <span className="create-promotion-error">{errors.question}</span>}
        </div>

        {/* Answer */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Câu trả lời <span className="create-promotion-required">*</span>
          </label>
          <textarea
            className={`create-promotion-textarea ${errors.answer ? 'error' : ''}`}
            rows={6}
            placeholder="Nhập câu trả lời"
            value={formData.answer}
            onChange={(e) => {
              setFormData({ ...formData, answer: e.target.value })
              if (errors.answer) setErrors({ ...errors, answer: undefined })
            }}
          />
          {errors.answer && <span className="create-promotion-error">{errors.answer}</span>}
        </div>
      </div>
    </CustomModal>
  )
}

export default UpdateFAQModal
