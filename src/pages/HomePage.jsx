import Header from "../components/Header"
import Footer from "../components/Footer"
import HeroSection from "../components/home/HeroSection"
import FeaturesSection from "../components/home/FeaturesSection"
import TestimonialsSection from "../components/home/TestimonialsSection"
import "../styles/HomePage.css"

function HomePage() {
  return (
    <div className="home-page">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  )
}

export default HomePage
