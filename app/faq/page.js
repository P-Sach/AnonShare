'use client'

import Header from "../components/Header"
import FaqSection from "../components/faq/FaqSection"
import Footer from "../components/Footer"

export default function FaqPage() {
  return (
    <div className="app">
      <div className="faq-page">
        <Header />
        <FaqSection />
        <Footer />
      </div>
    </div>
  )
}
