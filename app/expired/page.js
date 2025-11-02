'use client'

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { AlertTriangle, Clock, FileX, Download } from "lucide-react"
import "../styles/ExpiredPage.css"

function ExpiredContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'expired';

  const getContent = () => {
    switch (reason) {
      case 'download-limit':
        return {
          icon: <Download size={80} />,
          title: 'Download Limit Reached',
          description: 'This file has reached its maximum number of downloads and is no longer available.',
          showReasons: false,
        };
      case 'cancelled':
        return {
          icon: <AlertTriangle size={80} />,
          title: 'Session Cancelled',
          description: 'This sharing session has been cancelled by the owner and is no longer available.',
          showReasons: false,
        };
      case 'expired':
      default:
        return {
          icon: <FileX size={80} />,
          title: 'Session Expired or Not Found',
          description: 'This file sharing session is no longer available or does not exist.',
          showReasons: true,
        };
    }
  };

  const content = getContent();

  return (
    <main className="expired-container">
      <div className="expired-card">
        <div className="expired-icon">
          {content.icon}
        </div>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
        {content.showReasons && (
          <div className="expired-reasons">
            <div className="reason">
              <Clock size={24} />
              <div>
                <h3>Time Expired</h3>
                <p>The sharing session may have reached its time limit.</p>
              </div>
            </div>
            <div className="reason">
              <Download size={24} />
              <div>
                <h3>Download Limit Reached</h3>
                <p>The file may have reached its maximum download count.</p>
              </div>
            </div>
            <div className="reason">
              <AlertTriangle size={24} />
              <div>
                <h3>Session Cancelled</h3>
                <p>The owner may have cancelled the sharing session.</p>
              </div>
            </div>
            <div className="reason">
              <FileX size={24} />
              <div>
                <h3>Invalid Link</h3>
                <p>The link you followed might be incorrect or incomplete.</p>
              </div>
            </div>
          </div>
        )}
        <div className="expired-actions">
          <Link href="/share" className="share-new-btn">
            Share a New File
          </Link>
          <Link href="/" className="home-btn">
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ExpiredPage() {
  return (
    <div className="expired-page">
      <Header />
      <Suspense fallback={
        <main className="expired-container">
          <div className="expired-card">
            <div className="expired-icon">
              <FileX size={80} />
            </div>
            <h1>Loading...</h1>
          </div>
        </main>
      }>
        <ExpiredContent />
      </Suspense>
      <Footer />
    </div>
  )
}
