"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import { Clock, Download, File, FileText, ImageIcon, Film, Archive, Shield, Lock } from "lucide-react"
import "../../styles/DownloadPage.css"
import { fetchSessionInfo, downloadFile } from "../../utils/api"
import { useParams, useRouter } from 'next/navigation';
import { API_BASE } from '../../config';

export default function DownloadPage() {
  const [timeRemaining, setTimeRemaining] = useState(3600) // 1 hour in seconds
  const [password, setPassword] = useState("")
  const [isProtected, setIsProtected] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fileMeta, setFileMeta] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false); // Track download state
  const [passwordError, setPasswordError] = useState(""); // Track password errors
  const params = useParams();
  const accessCode = params.accessCode;
  const router = useRouter();
  const timerRef = useRef(null);
  const sessionCheckRef = useRef(null);

  // Protect this page - only accessible in dark theme (AnonShare)
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "dark"
    if (theme === "light") {
      router.push("/")
    }

    const handleThemeChange = () => {
      const newTheme = localStorage.getItem("theme") || "dark"
      if (newTheme === "light") {
        router.push("/")
      }
    }

    const interval = setInterval(handleThemeChange, 100)
    return () => clearInterval(interval)
  }, [router])


  useEffect(() => {
  
    if (!accessCode) {
      alert("Invalid download session");
      return;
    }

    if (timerRef.current){
      clearInterval(timerRef.current);
    }
  
    fetchSessionInfo(accessCode)
      .then((data) => {
        // Check if download limit has been reached
        if (data.downloadLimitReached) {
          router.push('/expired?reason=download-limit');
          return;
        }

        setIsProtected(data.passwordProtected);
        
        // Only set file metadata if it's included in response
        // (i.e., not password-protected or password already verified)
        if (data.name) {
          setFileMeta({
            name: data.name,
            size: data.size,
            mimeType: data.mimeType,
            isText: data.isText || false
          });
        }
  
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
  }, [accessCode, router]);

  // Poll session validity every 3 seconds
  useEffect(() => {
    if (!accessCode) return;

    const checkSessionValidity = async () => {
      try {
        await fetchSessionInfo(accessCode, password);
        // Session is still valid
      } catch (err) {
        // Session is invalid or expired
        console.log("Session no longer valid, redirecting...");
        router.push('/expired?reason=cancelled');
      }
    };

    // Check every 3 seconds
    sessionCheckRef.current = setInterval(checkSessionValidity, 3000);

    return () => {
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current);
      }
    };
  }, [accessCode, password, router]);
  

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours > 0 ? `${hours}:` : ""}${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleUnlock = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPasswordError("");
    
    try {
      // Fetch session info with password to verify
      const data = await fetchSessionInfo(accessCode, password);
      
      // Check if download limit has been reached
      if (data.downloadLimitReached) {
        router.push('/expired?reason=download-limit');
        return;
      }

      if (data.name) {
        // Password was correct, file details returned
        setFileMeta({
          name: data.name,
          size: data.size,
          mimeType: data.mimeType,
          isText: data.isText || false
        });
        setIsUnlocked(true);
        setPasswordError("");
      } else {
        // Password incorrect or other error
        setPasswordError("Incorrect password. Please try again.");
      }
    } catch (err) {
      console.error("Password verification failed", err);
      setPasswordError("Incorrect password. Please try again.");
    } finally {
      setIsLoading(false);
    }
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

  const handleDownload = async () => {
    if (!accessCode) return;
    
    // Check if this is a text message
    if (fileMeta && fileMeta.isText) {
      setIsDownloading(true);
      try {
        // Fetch encrypted text from backend
        const response = await fetch(`${API_BASE}/download/${accessCode}?password=${encodeURIComponent(password || '')}`);
        
        if (!response.ok) {
          const error = await response.json();
          alert(error.error || "Failed to fetch message");
          setIsDownloading(false);
          return;
        }
        
        const data = await response.json();
        
        // Store encrypted text and redirect to text viewer
        sessionStorage.setItem('encrypted-text', data.encryptedText);
        sessionStorage.setItem('text-has-password', data.hasPassword ? 'true' : 'false');
        sessionStorage.setItem('text-password', password || '');
        router.push('/text-viewer');
      } catch (error) {
        console.error("Error fetching text:", error);
        alert("Failed to fetch message");
      } finally {
        setIsDownloading(false);
      }
    } else {
      // File download
      setIsDownloading(true);
      try {
        downloadFile(accessCode, password);
        
        // Since we can't track progress with window.location.href,
        // we'll assume download completes after a short delay
        setTimeout(() => {
          setIsDownloading(false);
        }, 5000); // Adjust this timeout as needed
      } catch (error) {
        setIsDownloading(false);
        console.error("Download failed:", error);
      }
    }
  };

  const handleDownloadAll = () => {
    if (accessCode) downloadFile(accessCode, password);
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
              <Link href="/" className="home-btn">
                Return to Home
              </Link>
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(""); // Clear error when user types
                  }}
                  required
                />
                {passwordError && (
                  <div className="error-message" style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                    {passwordError}
                  </div>
                )}
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
                          {fileMeta.isText ? 'Loading message...' : 'Preparing download...'}
                        </div>
                      ) : (
                        <button 
                          className="download-btn" 
                          onClick={handleDownload}
                          disabled={isDownloading}
                        >
                          {fileMeta.isText ? (
                            <>
                              <FileText size={18} />
                              View Message
                            </>
                          ) : (
                            <>
                              <Download size={18} />
                              Download
                            </>
                          )}
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
