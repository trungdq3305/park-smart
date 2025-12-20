import { useEffect, useState } from 'react'
import { message } from 'antd'
import { useCreateFAQMutation } from '../../features/admin/FAQsAPI'
import { CustomModal } from '../common'
import '../promotions/CreatePromotionModal.css'

interface CreateFAQModalProps {
  open: boolean
  onClose: () => void
}

interface FormData {
  question: string
  answer: string
}

interface FormErrors {
  question?: string
  answer?: string
}

const CreateFAQModal: React.FC<CreateFAQModalProps> = ({ open, onClose }) => {
  const [createFAQ, { isLoading }] = useCreateFAQMutation()

  const [formData, setFormData] = useState<FormData>({
    question: '',
    answer: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open) {
      setFormData({
        question: '',
        answer: '',
      })
      setErrors({})
    }
  }, [open])

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
    if (!validateForm()) {
      return
    }

    try {
      const faqData = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
      }

      await createFAQ(faqData).unwrap()
      message.success('Tạo FAQ thành công')
      onClose()
    } catch (error: any) {
      message.error(error?.data?.message || 'Tạo FAQ thất bại')
    }
  }

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Tạo mới FAQ"
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
            {isLoading ? 'Đang tạo...' : 'Tạo mới'}
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

export default CreateFAQModal

