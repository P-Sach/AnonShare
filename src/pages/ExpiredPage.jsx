import { Link } from "react-router-dom"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { AlertTriangle, Clock, FileX } from "lucide-react"
import "../styles/ExpiredPage.css"

function ExpiredPage() {
  return (
    <div className="expired-page">
      <Header />
      <main className="expired-container">
        <div className="expired-card">
          <div className="expired-icon">
            <FileX size={80} />
          </div>
          <h1>Session Expired or Not Found</h1>
          <p>This file sharing session is no longer available or does not exist.</p>
          <div className="expired-reasons">
            <div className="reason">
              <Clock size={24} />
              <div>
                <h3>Time Expired</h3>
                <p>The sharing session may have reached its time limit.</p>
              </div>
            </div>
            <div className="reason">
              <AlertTriangle size={24} />
              <div>
                <h3>Session Cancelled</h3>
                <p>The owner may have cancelled the sharing session.</p>
              </div>
            </div>
            <div className="reason">
              <FileX size={24} />
              <div>
                <h3>Invalid Link</h3>
                <p>The link you followed might be incorrect or incomplete.</p>
              </div>
            </div>
          </div>
          <div className="expired-actions">
            <Link to="/share" className="share-new-btn">
              Share a New File
            </Link>
            <Link to="/" className="home-btn">
              Return to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default ExpiredPage
