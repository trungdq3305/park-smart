import cityImage from '../../assets/unnamed.png'
import './HeaderBanner.css'

const HeaderBanner: React.FC = () => {
  return (
    <div className="homepage-main">
      <div className="homepage-content">
        <div className="homepage-text">
          <h1 className="homepage-title">
            <span className="title-line-1">Park Smart</span>
            <span className="title-line-2">Platform</span>
          </h1>
          <p className="homepage-description">
            Find the best parking spot for your car.
          </p>
          <button className="homepage-cta-button">
            Download now
          </button>
          <p className="homepage-disclaimer">
            *Only pay after you use and get 100$ free
          </p>
        </div>
      </div>
      <div className="homepage-image">
        <img src={cityImage} alt="City Illustration" className="city-illustration" />
      </div>
    </div>
  )
}

export default HeaderBanner
