import React from 'react'
import './Footer.css'

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-content">
          <div className="footer-column">
            <h4>Park Smart</h4>
            <ul className="footer-links">
              <li><a href="#about">About Us</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Services</h4>
            <ul className="footer-links">
              <li><a href="#smart-parking">Smart Parking</a></li>
              <li><a href="#real-time">Real-time Availability</a></li>
              <li><a href="#reservations">Reservations</a></li>
              <li><a href="#payments">Digital Payments</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Support</h4>
            <ul className="footer-links">
              <li><a href="#help">Help Center</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#tutorials">Tutorials</a></li>
              <li><a href="#api">API Documentation</a></li>
            </ul>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              Copyright © 2025 Park Smart. All rights reserved.
            </p>
            <div className="footer-legal">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Use</a>
              <a href="#cookies">Cookies</a>
            </div>
            <div className="footer-location">
              <a href="#vietnam">Vietnam</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer