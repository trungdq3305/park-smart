import React from 'react'
import { CalculatorOutlined } from '@ant-design/icons'
import type { PricingPolicyLink } from '../../types/PricingPolicyLink'
import PricingPolicySelector from './PricingPolicySelector'
import CalculateFeeResult from './CalculateFeeResult'
import './CalculateFeeSection.css'

interface CalculateFeeSectionProps {
  pricingPolicies: PricingPolicyLink[] | undefined
  selectedPricingPolicyId: string | null
  onSelectPolicy: (policyId: string) => void
  onCalculateFee: () => void
  isCalculatingFee: boolean
  calculateFeeResult: any
}

const CalculateFeeSection: React.FC<CalculateFeeSectionProps> = ({
  pricingPolicies,
  selectedPricingPolicyId,
  onSelectPolicy,
  onCalculateFee,
  isCalculatingFee,
  calculateFeeResult,
}) => {
  return (
    <div className="session-calculate-fee-section">
      <h3 className="session-fee-section-title">Chọn chính sách giá</h3>
      <PricingPolicySelector
        policies={pricingPolicies || []}
        selectedPolicyId={selectedPricingPolicyId}
        onSelectPolicy={onSelectPolicy}
      />
      <button
        className="session-calculate-fee-btn"
        onClick={onCalculateFee}
        disabled={isCalculatingFee || !selectedPricingPolicyId}
      >
        <CalculatorOutlined />
        <span>{isCalculatingFee ? 'Đang tính...' : 'Tính tiền thủ công'}</span>
      </button>
      <CalculateFeeResult result={calculateFeeResult} />
    </div>
  )
}

export default CalculateFeeSection
