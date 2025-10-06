import Slogan from '../slogan/Slogan'
import HeaderBanner from '../header-banner/HeaderBanner'
import TermsPoliciesSection from '../terms-policies/TermsPoliciesSection'
import './HomePage.css'
import type { TermPolicy } from '../../types/termPolicty'
import { useGetTermsPoliciesQuery } from '../../features/terms-policies/termsAPI'

interface TermsPoliciesResponse {
  data: {
    data: TermPolicy[]
  }
  isLoading: boolean
}

const HomePage: React.FC = () => {
  const { data, isLoading } = useGetTermsPoliciesQuery<TermsPoliciesResponse>({})
  const termPoliciesData = data?.data || []

  return (
    <div id="home" className="homepage-container">
      <Slogan />
      <HeaderBanner />
      <TermsPoliciesSection data={termPoliciesData} isLoading={isLoading} />
    </div>
  )
}

export default HomePage
