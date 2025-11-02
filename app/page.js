'use client'

import Header from "./components/Header"
import Footer from "./components/Footer"
import HeroSection from "./components/home/HeroSection"
import FeaturesSection from "./components/home/FeaturesSection"
import TestimonialsSection from "./components/home/TestimonialsSection"
import "./styles/HomePage.css"
import "./styles/App.css"

export default function HomePage() {
  return (
    <div className="app">
      <div className="home-page">
        <Header />
        <main>
          <HeroSection />
          <FeaturesSection />
          <TestimonialsSection />
        </main>
        <Footer />
      </div>
    </div>
  )
}
