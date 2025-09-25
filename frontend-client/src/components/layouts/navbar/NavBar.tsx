import React from "react";
import './navBar.css'
const NavBar: React.FC = () => {
    return (
        <nav className="apple-navbar">
            <ul>
                <li><a href="#">Apple</a></li>
                <li><a href="#">Entertainment</a></li>
                <li><a href="#">Accessories</a></li>
                <li><a href="#">Support</a></li>
            </ul>
        </nav>

    )
}

export default NavBar
