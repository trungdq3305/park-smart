import Slogan from '../slogan/Slogan'
import HeaderBanner from '../header-banner/HeaderBanner'
import TermsPoliciesSection from '../terms-policies/TermsPoliciesSection'
import FAQsSection from '../faqs/FAQsSection'
import './HomePage.css'
import type { TermPolicy } from '../../types/termPolicty'
import { useGetTermsPoliciesQuery } from '../../features/terms-policies/termsAPI'
import type { FAQ } from '../../types/faqs'
import { useGetFAQsQuery } from '../../features/faqs/faqsAPI'

interface TermsPoliciesResponse {
  data: {
    data: TermPolicy[]
  }
  isLoading: boolean
}
interface FAQsResponse {
  data: {
    data: {
      data: FAQ[]
    }
  }
  isLoading: boolean
}

const HomePage: React.FC = () => {
  const { data, isLoading } = useGetTermsPoliciesQuery<TermsPoliciesResponse>({})
  const termPoliciesData = data?.data || []
  const { data: faqsData, isLoading: faqsLoading } = useGetFAQsQuery<FAQsResponse>({})
  const faqs = faqsData?.data?.data || []
  return (
    <div id="home" className="homepage-container">
      <Slogan />
      <HeaderBanner />
      <TermsPoliciesSection data={termPoliciesData} isLoading={isLoading} />
      <FAQsSection data={faqs} isLoading={faqsLoading} />
    </div>
  )
}

export default HomePage
