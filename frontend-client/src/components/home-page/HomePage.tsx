import Slogan from "../slogan/Slogan";
import headerImg from '../../assets/header.jpg';
const HomePage: React.FC = () => {
    return (
        <div>
            <Slogan />
            <div
                style={{ marginTop: '20px' }}>
                <img src={headerImg} alt="Description of image"
                    style={{ height: "30%" }} />
            </div>
        </div>
    )
}

export default HomePage;