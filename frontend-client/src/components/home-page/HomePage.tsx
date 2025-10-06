import Slogan from '../slogan/Slogan'
import HeaderBanner from '../header-banner/HeaderBanner'
import './HomePage.css'
import type { TermPolicy } from '../../types/termPolicty'
import { useGetTermsPoliciesQuery } from '../../features/terms-policies/termsAPI'
interface TermsPoliciesResponse {
data :{
  data : TermPolicy[]
}
isLoading: boolean
}

const HomePage: React.FC = () => {

const { data , isLoading } = useGetTermsPoliciesQuery<TermsPoliciesResponse>({})
const termPoliciesData = data?.data || []
console.log(termPoliciesData)
  return (
    <div className="homepage-container">
      <Slogan />
      <HeaderBanner />
    </div>
  )
}

export default HomePage
