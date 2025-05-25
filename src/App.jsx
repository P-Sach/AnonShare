import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import FaqPage from "./pages/FaqPage"
import SharePage from "./pages/SharePage"
import SessionPage from "./pages/SessionPage"
import DownloadPage from "./pages/DownloadPage"
import ExpiredPage from "./pages/ExpiredPage"
import LocSharePage from "./pages/LocSharePage"
import AccessPage from "./pages/AccessPage"

import "./App.css"
function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/share" element={<SharePage />} />
          <Route path="/session" element={<SessionPage />} />
          <Route path="/download/:sessionId" element={<DownloadPage />} />
          <Route path="/expired" element={<ExpiredPage />} />
          <Route path="/locshare" element={<LocSharePage />} />
          <Route path="/access" element={<AccessPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
