import { useState } from 'react'
import './FaqItem.css'

function FaqItem({ item }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleOpen = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`}>
      <button className="faq-question" onClick={toggleOpen}>
        <span className="plus-icon"></span>
        {item.question}
      </button>
      <div className="faq-answer">
        <p>{item.answer}</p>
      </div>
    </div>
  )
}

export default FaqItem