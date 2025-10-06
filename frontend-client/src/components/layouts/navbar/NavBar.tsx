import React from 'react'
import { useSmoothScroll } from '../../../hooks/useSmoothScroll'
import './navBar.css'

const NavBar: React.FC = () => {
  const { scrollToSection, scrollToTop } = useSmoothScroll()

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault()
    scrollToSection(sectionId)
  }

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    scrollToTop()
  }

  return (
    <nav className="apple-navbar">
      <ul>
        <li>
          <a href="#home" onClick={handleHomeClick}>Home</a>
        </li>
        <li>
          <a href="#terms-policies" onClick={(e) => handleNavClick(e, 'terms-policies')}>
            Terms & Policies
          </a>
        </li>
        <li>
          <a href="/map">Map</a>
        </li>
        <li>
          <a href="#faqs" onClick={(e) => handleNavClick(e, 'faqs')}>
            FAQs
          </a>
        </li>
      </ul>
    </nav>
  )
}

export default NavBar
