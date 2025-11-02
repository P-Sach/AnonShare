'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import "./Header.css"

function Header() {
  const [theme, setTheme] = useState(() => {
    // Initialize theme from localStorage or default to 'dark'
    if (typeof window !== 'undefined') {
      return localStorage.getItem("theme") || "dark"
    }
    return "dark"
  });
  const [logoText, setLogoText] = useState(theme === "light" ? "LocShare" : "AnonShare")
  const router = useRouter()

  useEffect(() => {
    setLogoText(theme === "light" ? "LocShare" : "AnonShare")
    
    // Apply theme to body and save to localStorage
    if (typeof window !== 'undefined') {
      document.body.className = theme
      localStorage.setItem("theme", theme)
    }
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
      router.push("/locshare")
    } else {
      router.push("/share")
    }
  }

  const handleAccessClick = (e) => {
    e.preventDefault()
    // Both themes use the same access page, but it renders differently based on theme
    router.push("/access")
  }


  return (
    <header className="header">
      <div className="container header-container" > 
        <Link href="/" className="logo" onDoubleClick={toggleTheme}>
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
