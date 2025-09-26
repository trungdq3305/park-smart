import React from 'react'
import './navBar.css'
const NavBar: React.FC = () => {
  return (
    <nav className="apple-navbar">
      <ul>
        <li>
          <a href="#">Home</a>
        </li>
        <li>
          <a href="#">Terms & Policies</a>
        </li>
        <li>
          <a href="#">Map</a>
        </li>
        <li>
          <a href="#">FAQs</a>
        </li>
      </ul>
    </nav>
  )
}

export default NavBar
