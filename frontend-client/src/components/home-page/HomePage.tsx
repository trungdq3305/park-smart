import Slogan from '../slogan/Slogan'
import HeaderBanner from '../header-banner/HeaderBanner'
import './HomePage.css'

const HomePage: React.FC = () => {
  return (
    <div className="homepage-container">
      <Slogan />
      <HeaderBanner />
    </div>
  )
}

export default HomePage
