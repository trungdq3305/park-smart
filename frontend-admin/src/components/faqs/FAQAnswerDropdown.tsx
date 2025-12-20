import { useState } from 'react'
import { DownOutlined, UpOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import './FAQAnswerDropdown.css'

interface FAQAnswerDropdownProps {
  answer: string
}

const FAQAnswerDropdown: React.FC<FAQAnswerDropdownProps> = ({ answer }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="faq-answer-dropdown">
      <button className="faq-answer-toggle" onClick={toggleDropdown}>
        <QuestionCircleOutlined />
        <span>Xem câu trả lời</span>
        {isOpen ? <UpOutlined /> : <DownOutlined />}
      </button>

      {isOpen && (
        <div className="faq-answer-content">
          <div className="faq-answer-text">
            <p>{answer || 'Chưa có câu trả lời'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default FAQAnswerDropdown

