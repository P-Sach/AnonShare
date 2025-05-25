import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo-section">
            <div className="footer-logo">AnonShare</div>
            <p className="footer-tagline">Stay Connected with Us</p>
          </div>
          
          <div className="footer-links">
            <div className="footer-column">
              <h3>LINKS</h3>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Use</a></li>
                <li><a href="#">Support Center</a></li>
                <li><a href="#">Feedback</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h3>RESOURCES</h3>
              <ul>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Latest Updates</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="copyright">© Copyright 2025</p>
          <div className="subscribe">
            <input type="email" placeholder="Email" />
            <button>Subscribe</button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer