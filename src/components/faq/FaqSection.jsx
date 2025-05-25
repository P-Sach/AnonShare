import { useState } from 'react'
import FaqItem from './FaqItem'
import './FaqSection.css'

function FaqSection() {
  const faqItems = [
    {
      id: 1,
      question: "What files can I upload?",
      answer: "You can upload various file types, including documents, images, and videos."
    },
    {
      id: 2,
      question: "How do I know if my file uploaded successfully?",
      answer: "You will receive a confirmation message once your file is uploaded."
    },
    {
      id: 3,
      question: "How large can my file be?",
      answer: "File size limits depend on your account type. Please check your account settings for details."
    },
    {
      id: 4,
      question: "Are there size limits for uploads?",
      answer: "Yes, there are size limits depending on your account type and subscription level."
    },
    {
      id: 5,
      question: "What if the upload fails?",
      answer: "If an upload fails, you'll receive an error message. Try reducing the file size or checking your connection."
    },
    {
      id: 6,
      question: "What formats are accepted?",
      answer: "We accept most common file formats including PDF, DOCX, JPG, PNG, MP4, and many others."
    },
    {
      id: 7,
      question: "Can I cancel an upload?",
      answer: "Yes, you can cancel an upload in progress by clicking the cancel button next to the progress bar."
    },
    {
      id: 8,
      question: "Can I upload multiple files?",
      answer: "Yes, you can select and upload multiple files at once."
    }
  ]

  return (
    <main className="faq-section">
      <div className="container">
        <div className="faq-header">
          <h2>FREQUENTLY ASKED QUESTIONS</h2>
          <h1>File Upload FAQ Section</h1>
          <p>Find answers to common questions regarding the file upload process.</p>
        </div>
        
        <div className="faq-grid">
          <div className="faq-column">
            <FaqItem item={faqItems[0]} />
            <FaqItem item={faqItems[2]} />
            <FaqItem item={faqItems[4]} />
            <FaqItem item={faqItems[6]} />
          </div>
          <div className="faq-column">
            <FaqItem item={faqItems[1]} />
            <FaqItem item={faqItems[3]} />
            <FaqItem item={faqItems[5]} />
            <FaqItem item={faqItems[7]} />
          </div>
        </div>
      </div>
    </main>
  )
}

export default FaqSection