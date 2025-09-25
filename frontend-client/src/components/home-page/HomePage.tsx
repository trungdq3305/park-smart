import Slogan from "../slogan/Slogan";
import headerImg from '../../assets/5218594.jpg';
import './HomePage.css';

const HomePage: React.FC = () => {
    return (
        <div>
            <Slogan />
            <div className="homepage-header">
                <img
                    src={headerImg}
                    alt="Header"
                    className="homepage-header-img"
                />
                <div className="homepage-header-overlay">
                    <h2>Finding a place to park your car ?</h2>
                    <button>
                        Download now
                    </button>
                </div>
            </div>
        </div>
    )
}

export default HomePage;