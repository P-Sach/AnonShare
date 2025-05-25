import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import "./Header.css"

function Header() {
  const [theme, setTheme] = useState(() => {
    // Initialize theme from localStorage or default to 'dark'
    return localStorage.getItem("theme") || "dark"
  });
  const [logoText, setLogoText] = useState(theme === "light" ? "LocShare" : "AnonShare")
  const navigate = useNavigate()

  useEffect(() => {
    setLogoText(theme === "light" ? "LocShare" : "AnonShare")
    
    // Apply theme to body and save to localStorage
    document.body.className = theme
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = () => {
    
    if (theme === "dark") {
      setTheme("light")
      setLogoText("LocShare")
    } else {
      setTheme("dark")
      setLogoText("AnonShare")
    }
  }

  const handleSendClick = (e) => {
    e.preventDefault()
    // Redirect based on current theme
    if (theme === "light") {
      navigate("/locshare")
    } else {
      navigate("/share")
    }
  }

  const handleAccessClick = (e) => {
    e.preventDefault()
    // Redirect based on current theme
    if (theme === "light") {
      navigate("/access")
    } else {
      navigate("/download")
    }
  }


  return (
    <header className="header">
      <div className="container header-container" > 
        <Link to="/" className="logo" onDoubleClick={toggleTheme}>
          {logoText}
        </Link>
        <div className="header-buttons">
          <button className="header-btn" onClick={handleSendClick}>Send Securely</button>
          <button className="header-btn light" onClick={handleAccessClick}>Safely Access Files</button>
        </div>
      </div>
    </header>
  )
}

export default Header
