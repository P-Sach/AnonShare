'use client'

import "./TestimonialsSection.css"

function TestimonialsSection() {
  const testimonials = [
    {
      name: "P",
      title: "Design Director",
      quote: "Using AnonShare for secure file sharing has never been easier.",
    },
    {
      name: "J",
      title: "Virtual Assistant",
      quote: "The ability to control how long my files are accessible is fantastic!",
    },
    {
      name: "D",
      title: "Product Manager",
      quote: "Finally, a platform that respects privacy! AnonShare has my full trust.",
    },
    {
      name: "J",
      title: "Marketing Manager",
      quote: "I am impressed by how user-friendly it is while ensuring security.",
    },
    {
      name: "T",
      title: "Business Owner",
      quote: "After trying many platforms, AnonShare stands out for its commitment to users' privacy.",
    },
    {
      name: "J",
      title: "Data Specialist",
      quote: "File sharing feels safe and secure with AnonShare.",
    },
  ]

  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="testimonials-header">
          <h2>USERS LOVE US!</h2>
          <h1>
            Trusted Anonymous
            <br />
            Sharing Platform
          </h1>
          <p>
            Hundreds of users have shared their positive experiences about AnonShare, praising our dedication to secure
            and anonymous file transfer which enables safe sharing without compromising their privacy.
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div className="testimonial-card" key={index}>
              <div className="testimonial-avatar">
                <div className="avatar-placeholder">
                </div>
              </div>
              <div className="testimonial-info">
                <h3>{testimonial.name}</h3>
                <p className="testimonial-title">{testimonial.title}</p>
              </div>
              <p className="testimonial-quote">{testimonial.quote}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection
