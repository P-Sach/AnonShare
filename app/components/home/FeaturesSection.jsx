'use client'

import "./FeaturesSection.css"

function FeaturesSection() {
  const features = [
    {
      icon: "mouse-pointer",
      title: "Drag & Drop",
      description: "Effortlessly upload files by dragging them into our upload area or using the select button.",
    },
    {
      icon: "file",
      title: "File Selection",
      description: "Choose files from your device easily with our intuitive file selection interface.",
    },
    {
      icon: "upload-cloud",
      title: "Upload Now",
      description: "Securely store and share your files without any hassle with our robust upload options.",
    },
    {
      icon: "share",
      title: "Instant Sharing",
      description: "Share your files instantly after upload with secure, customizable links for privacy.",
    },
    {
      icon: "link",
      title: "Custom Links",
      description: "Create personalized links with adjustable expiration times for your shared files.",
    },
    {
      icon: "file-text",
      title: "Multiple Formats",
      description: "Support for a wide range of file formats, allowing you to upload anything you need.",
    },
  ]

  return (
    <section className="features-section">
      <div className="container">
        <div className="features-header">
          <h2>UPLOAD SECURELY</h2>
          <h1>
            Seamless File
            <br />
            Sharing Made Simple
          </h1>
          <p>Easily share your files safely with our user-friendly upload feature. No registration required.</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-icon">
                <i className={`icon-${feature.icon}`}></i>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
