"use client"

import { useState, useEffect, useRef } from "react"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { Clock, Download, File, FileText, ImageIcon, Film, Archive, Shield, Lock } from "lucide-react"
import "../styles/DownloadPage.css"
import { fetchSessionInfo, downloadFile } from "../utils/api"
import { useParams } from 'react-router-dom';

function DownloadPage() {
  const [timeRemaining, setTimeRemaining] = useState(3600) // 1 hour in seconds
  const [password, setPassword] = useState("")
  const [isProtected, setIsProtected] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fileMeta, setFileMeta] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false); // Track download state  const timerRef = useRef(null)
  const { sessionId } = useParams();
  const timerRef = useRef(null);


  useEffect(() => {
  
    if (!sessionId) {
      alert("Invalid download session");
      return;
    }

    if (timerRef.current){
      clearInterval(timerRef.current);
    }
  
    fetchSessionInfo(sessionId)
      .then((data) => {
        setIsProtected(data.passwordProtected);
        setFileMeta({
          name: data.name,
          size: data.size,
          mimeType: data.mimeType,
        });
  
        const expiry = new Date(data.expiresAt).getTime();
        const now = Date.now();
        const secondsLeft = Math.floor((expiry - now) / 1000);
        setTimeRemaining(secondsLeft > 0 ? secondsLeft : 0);

        if (secondsLeft > 0){
          const startTime = Date.now();
          const endTime = expiry;

          timerRef.current = setInterval(() => {
            const now = Date.now();
            const newSecondsLeft = Math.floor((endTime - now) / 1000);

            if (newSecondsLeft <= 0){
              setTimeRemaining(0);
              clearInterval(timerRef.current);
            }else{
              setTimeRemaining(newSecondsLeft);
            }
          }, 1000);
        }
      })
      .catch((err) => {
        console.error("Session fetch failed", err);
        setTimeRemaining(0); // expired or invalid
      });

      return () => {
        if (timerRef.current){
          clearInterval(timerRef.current);
        }
      };
  }, [sessionId]);
  

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours > 0 ? `${hours}:` : ""}${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleUnlock = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsUnlocked(true); // fake unlock for now
      setIsLoading(false);
    }, 1000);
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <File size={24} />;
    
    if (mimeType.includes("pdf")) return <FileText size={24} />
    if (mimeType.includes("image")) return <ImageIcon size={24} />
    if (mimeType.includes("video")) return <Film size={24} />
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar") || mimeType.includes("archive")) 
      return <Archive size={24} />
    
    return <File size={24} />
  }

  const handleDownload = () => {
    if (!sessionId) return;
    
    setIsDownloading(true);
    try {
      downloadFile(sessionId, password);
      
      // Since we can't track progress with window.location.href,
      // we'll assume download completes after a short delay
      setTimeout(() => {
        setIsDownloading(false);
      }, 5000); // Adjust this timeout as needed
    } catch (error) {
      setIsDownloading(false);
      console.error("Download failed:", error);
    }
  };
  const handleDownloadAll = () => {
    const query = new URLSearchParams(window.location.search);
    const sessionId = query.get("id");
    if (sessionId) downloadFile(sessionId, password);
  };

  if (timeRemaining === 0) {
    return (
      <div className="download-page">
        <Header />
        <main className="download-container">
          <div className="download-card">
            <div className="session-expired">
              <Clock size={60} className="expired-icon" />
              <h1>Session Expired</h1>
              <p>This file sharing session is no longer available. The time has expired.</p>
              <a href="/" className="home-btn">
                Return to Home
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="download-page">
      <Header />
      <main className="download-container">
        <div className="download-card">
          <div className="download-header">
            <h1>Download Files</h1>
            <div className="session-expiry">
              <Clock size={18} />
              <span>Session expires in: </span>
              <span className="countdown">{formatTime(timeRemaining)}</span>
            </div>
          </div>

          {isProtected && !isUnlocked ? (
            <div className="password-protection">
              <div className="protection-icon">
                <Lock size={40} />
              </div>
              <h2>Password Protected Files</h2>
              <p>These files are protected. Please enter the password to access them.</p>

              <form onSubmit={handleUnlock} className="password-form">
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="submit" disabled={isLoading || !password}>
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield size={18} />
                      Unlock Files
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : fileMeta ?(
            <>
              <div className="files-list">
                  <div className="file-item">
                    <div className="file-info">
                      <div className="file-icon">{getFileIcon(fileMeta.mimeType)}</div>
                      <div className="file-details">
                        <div className="file-name">{fileMeta.name}</div>
                        <div className="file-size">{fileMeta.size}</div>
                      </div>
                    </div>
                    <div className="file-actions">
                      {isDownloading ? (
                        <div className="downloading-state">
                          <span className="spinner"></span>
                          Preparing download...
                        </div>
                      ) : (
                        <button 
                          className="download-btn" 
                          onClick={handleDownload}
                          disabled={isDownloading}
                        >
                          <Download size={18} />
                          {isDownloading ? 'Downloading...' : 'Download'}
                        </button>
                      )}
                    </div>
                  </div>
              </div>

              <div className="download-all">
                <button className="download-all-btn" onClick={handleDownloadAll}>
                  <Download size={18} />
                  Download All Files
                </button>
              </div>

              <div className="download-info">
                <p>Files ready for download. They will be available for {formatTime(timeRemaining)}.</p>
              </div>
            </>
            ) : (
              <div className="loading-file">
                <p>Loading file information...</p>
              </div>
            )}
          
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default DownloadPage
