"use client"

import PhoneMockup from "./PhoneMockup"
import "./HeroSection.css"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

function HeroSection() {

  const [theme, setTheme] = useState("dark")
  const router = useRouter()

  useEffect(() => {
    // Get theme from localStorage when component mounts
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem("theme")
      if (savedTheme) {
        setTheme(savedTheme)
      }
    }
  }, [])

  const handleBadgeClick = (e) => {
    e.preventDefault()
    // Redirect based on current theme
    if (theme === "light") {
      router.push("/locshare")
    } else {
      router.push("/share")
    }
  }
  return (
    <section className="hero-section">
      <div className="container">

        <div className="hero-content">
          <h1>
            Maximize Your
            <br />
            File Sharing
          </h1>
          <button
        className="hero-badge"
        onClick={handleBadgeClick} 
        aria-label="Share Files Securely">
          <span className="new-badge">New</span>
          <span className="badge-text">Share Files Securely</span>
          <span className="badge-arrow">→</span>
        </button>
          <div className="get-started">
            </div>
            <span className="get-started-text">Get started now!</span>
          </div>
        </div>

        <div className="hero-image">
          <PhoneMockup screenimage="src\assets\react.svg" />
        </div>
    </section>
  )
}

export default HeroSection
