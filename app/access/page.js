"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { Key, Link as LinkIcon, AlertTriangle, FileText, Download, Server, Lock, Shield } from "lucide-react"
import "../styles/AccessPage.css"

export default function AccessPage() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("theme") || "dark"
    }
    return "dark"
  })
  const [urlInput, setUrlInput] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  // LocShare specific states
  const [accessKey, setAccessKey] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionInfo, setConnectionInfo] = useState(null)
  const [password, setPassword] = useState("")
  const [files, setFiles] = useState([])
  const [hasValidLocShareKey, setHasValidLocShareKey] = useState(false)
  const sessionCheckRef = useRef(null)

  // Check for QR code access key in sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const qrKey = sessionStorage.getItem('locshare-access-key')
      if (qrKey) {
        setAccessKey(qrKey)
        setHasValidLocShareKey(true)
        // Clear it after using
        sessionStorage.removeItem('locshare-access-key')
        // Auto-verify if in LocShare mode
        if (theme === 'light') {
          // Auto-trigger verification after a short delay
          setTimeout(() => {
            handleVerifyKey({ preventDefault: () => {} }, qrKey)
          }, 500)
        }
      } else if (theme === 'light') {
        // If in light theme but no key, user tried to access directly
        setHasValidLocShareKey(false)
      }
    }
  }, [theme, handleVerifyKey])

  useEffect(() => {
    const currentTheme = localStorage.getItem("theme") || "dark"
    setTheme(currentTheme)

    const handleThemeChange = () => {
      const newTheme = localStorage.getItem("theme") || "dark"
      setTheme(newTheme)
    }

    window.addEventListener("storage", handleThemeChange)
    const interval = setInterval(() => {
      const newTheme = localStorage.getItem("theme") || "dark"
      if (newTheme !== theme) {
        setTheme(newTheme)
      }
    }, 100)

    return () => {
      window.removeEventListener("storage", handleThemeChange)
      clearInterval(interval)
    }
  }, [theme])

  // Poll LocShare session validity when connected
  useEffect(() => {
    if (!isConnected || !connectionInfo) return;

    const checkServerStatus = async () => {
      try {
        const response = await fetch(`http://${connectionInfo.host}:${connectionInfo.port}/ping`);
        if (!response.ok) {
          // Server is down or session ended
          throw new Error('Server not responding');
        }
      } catch (error) {
        console.log("Local server no longer available");
        setError("The sharing session has ended. The server is no longer available.");
        setIsConnected(false);
        setFiles([]);
        clearInterval(sessionCheckRef.current);
      }
    };

    // Check every 3 seconds
    sessionCheckRef.current = setInterval(checkServerStatus, 3000);

    return () => {
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current);
      }
    };
  }, [isConnected, connectionInfo]);

  // AnonShare handlers
  const handleAnonShareSubmit = (e) => {
    e.preventDefault()
    setError("")

    if (!urlInput.trim()) {
      setError("Please enter a URL or access code")
      return
    }

    try {
      if (urlInput.includes('http://') || urlInput.includes('https://') || urlInput.includes('/download/')) {
        let accessCode = ''
        
        if (urlInput.includes('/download/')) {
          const parts = urlInput.split('/download/')
          accessCode = parts[1]?.split('?')[0]?.split('/')[0] || ''
        } else {
          const url = new URL(urlInput.startsWith('http') ? urlInput : `https://${urlInput}`)
          const pathParts = url.pathname.split('/').filter(p => p)
          accessCode = pathParts[pathParts.length - 1] || ''
        }

        if (accessCode) {
          router.push(`/download/${accessCode}`)
        } else {
          setError("Could not extract access code from URL")
        }
      } else {
        const cleanCode = urlInput.trim()
        router.push(`/download/${cleanCode}`)
      }
    } catch (err) {
      console.error("Error parsing URL:", err)
      const cleanCode = urlInput.trim()
      router.push(`/download/${cleanCode}`)
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setUrlInput(text)
      setError("")
    } catch (err) {
      console.error("Failed to read clipboard:", err)
      setError("Failed to read from clipboard. Please paste manually.")
    }
  }

  // LocShare handlers
  const handleVerifyKey = useCallback(async (e, keyOverride = null) => {
    e.preventDefault()
    setError("")

    const keyToUse = keyOverride || accessKey

    if (!keyToUse) {
      setError("Please enter an access key")
      return
    }

    setIsVerifying(true)

    try {
      // Decode the base64 access key
      const decoded = atob(keyToUse)
      const keyData = JSON.parse(decoded)
      
      // Validate network access - check if host is a local IP
      const host = keyData.host
      const isLocalIP = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.0\.0\.1|localhost)/.test(host)
      
      if (!isLocalIP) {
        setIsVerifying(false)
        setError("Access denied: This share is only available on the local network")
        return
      }

      // Mark as having valid key for LocShare UI
      setHasValidLocShareKey(true)
      
      // Extract connection info
      const connInfo = {
        host: keyData.host,
        port: keyData.port,
        fileName: keyData.fileName,
        requiredPassword: keyData.password,
      }
      
      setConnectionInfo(connInfo)
      setIsVerifying(false)

      // If no password required, proceed to show file info
      if (!keyData.password) {
        await fetchLocFileInfo(keyData.host, keyData.port, null)
      }
    } catch (error) {
      setIsVerifying(false)
      setError("Invalid access key format")
      console.error("Error decoding key:", error)
    }
  }, [accessKey])

  const fetchLocFileInfo = async (host, port, password = null) => {
    try {
      // Fetch file info from the local server
      const response = await fetch(`http://${host}:${port}/info`)
      
      if (!response.ok) {
        throw new Error('Failed to connect to local server')
      }

      const fileInfo = await response.json()
      
      // Check if download limit reached
      if (fileInfo.downloadLimitReached) {
        setError("Download limit has been reached for this file.")
        return
      }
      
      const files = [{
        id: 1,
        name: fileInfo.name,
        size: `${(fileInfo.size / 1024 / 1024).toFixed(2)} MB`,
        type: fileInfo.type,
        passwordProtected: fileInfo.passwordProtected,
        downloadCount: fileInfo.downloadCount || 0,
        maxDownloads: fileInfo.maxDownloads,
        isText: fileInfo.isText || false
      }]
      
      setFiles(files)
      setIsConnected(true)
    } catch (error) {
      console.error("Error fetching file info:", error)
      setError("Failed to connect to local server. Make sure the sharer is online and you're on the same network.")
    }
  }

  const handleConnect = async (e) => {
    if (e) e.preventDefault()

    if (connectionInfo.requiredPassword && connectionInfo.requiredPassword !== password) {
      setError("Incorrect password")
      return
    }

    setIsVerifying(true)

    // Fetch file info with password
    await fetchLocFileInfo(connectionInfo.host, connectionInfo.port, password)
    setIsVerifying(false)
  }

  const handleDownload = async (fileId) => {
    const file = files.find(f => f.id === fileId);
    
    if (file && file.isText) {
      // Text mode - fetch and decrypt text
      try {
        const response = await fetch(
          `http://${connectionInfo.host}:${connectionInfo.port}/download?password=${encodeURIComponent(password || '')}`
        );
        
        if (!response.ok) {
          const error = await response.json();
          setError(error.error || "Failed to fetch text");
          return;
        }
        
        const data = await response.json();
        
        // Store encrypted text and redirect to text viewer
        // For LocShare: text is already encrypted client-side if password was set
        // The password used for encryption is the same as the access password
        sessionStorage.setItem('encrypted-text', data.encryptedText);
        sessionStorage.setItem('text-has-password', password ? 'true' : 'false');
        sessionStorage.setItem('text-password', password || '');
        
        router.push('/text-viewer');
      } catch (error) {
        console.error("Error fetching text:", error);
        setError("Failed to fetch message");
      }
    } else {
      // File mode - download directly from the local server
      const downloadUrl = `http://${connectionInfo.host}:${connectionInfo.port}/download?password=${encodeURIComponent(password || '')}`;
      console.log(`Downloading from local server: ${downloadUrl}`);
      
      // Trigger download
      window.location.href = downloadUrl;
    }
  }

  const handleDownloadAll = () => {
    files.forEach((file) => handleDownload(file.id))
  }

  const getFileIcon = (type) => {
    switch (type) {
      case "pdf":
        return <FileText size={24} />
      case "image":
        return <FileText size={24} />
      default:
        return <FileText size={24} />
    }
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setConnectionInfo(null)
    setFiles([])
    setPassword("")
    setAccessKey("")
    setHasValidLocShareKey(false)
  }

  // Render AnonShare access page (dark theme)
  if (theme === "dark") {
    return (
      <div className="access-page">
        <Header />
        <main className="access-container">
          <div className="access-card">
            <div className="access-header">
              <div className="access-icon">
                <Key size={48} />
              </div>
              <h1>Access Shared Files</h1>
              <p>Enter the download URL or access code you received to access the shared files</p>
            </div>

            <form onSubmit={handleAnonShareSubmit} className="access-form">
              <div className="form-group">
                <label htmlFor="url-input">
                  <LinkIcon size={18} />
                  Download URL or Access Code
                </label>
                <div className="input-wrapper">
                  <input
                    id="url-input"
                    type="text"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value)
                      setError("")
                    }}
                    placeholder="e.g., https://anonshare.com/download/abc123 or abc123"
                    className="access-input"
                    autoFocus
                  />
                  <button 
                    type="button" 
                    className="paste-btn"
                    onClick={handlePasteFromClipboard}
                    title="Paste from clipboard"
                  >
                    Paste
                  </button>
                </div>
                <small className="input-hint">
                  You can paste the full URL or just the access code
                </small>
              </div>

              {error && (
                <div className="error-message">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              <button type="submit" className="access-btn">
                <Key size={18} />
                Access Files
              </button>
            </form>

            <div className="access-info">
              <div className="info-section">
                <FileText size={20} />
                <div>
                  <h3>What&apos;s an access code?</h3>
                  <p>
                    An access code is a unique identifier that allows you to download files shared through AnonShare.
                    You should have received this code from the person sharing the files.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="access-examples">
            <h3>Accepted formats:</h3>
            <div className="example-list">
              <div className="example-item">
                <code>https://anonshare.com/download/abc123xyz</code>
                <span>Full download URL</span>
              </div>
              <div className="example-item">
                <code>/download/abc123xyz</code>
                <span>Relative URL path</span>
              </div>
              <div className="example-item">
                <code>abc123xyz</code>
                <span>Just the access code</span>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Render LocShare access page (light theme)
  return (
    <div className="access-page">
      <Header />
      <main className="access-container">
        <div className="access-card">
          <div className="access-header">
            <h1>Access Local Shared Files</h1>
            <p>Enter the access key to connect to locally shared files on your network</p>
          </div>

          {/* Only show form if user came from QR/valid link or already has connection */}
          {!hasValidLocShareKey && !isConnected && !connectionInfo && (
            <div className="access-denied">
              <div className="denied-icon">
                <Shield size={48} />
              </div>
              <h2>Access Restricted</h2>
              <p>This page is only accessible through a valid LocShare link or QR code.</p>
              <p className="help-text">
                To access files shared on your local network:
              </p>
              <ol className="access-steps">
                <li>Ask the sender to share their QR code or link</li>
                <li>Scan the QR code with your device camera, or</li>
                <li>Click the link they provide</li>
                <li>Make sure you&apos;re on the same WiFi network as the sender</li>
              </ol>
              <p className="security-note-text">
                <Shield size={16} />
                For security, manual access key entry is disabled. You must use the QR code or link provided by the sender.
              </p>
              <button 
                className="back-home-btn" 
                onClick={() => router.push('/')}
              >
                Back to Home
              </button>
            </div>
          )}

          {/* Removed manual access key input - only QR/link access allowed */}

          {!isConnected && connectionInfo && connectionInfo.requiredPassword && (
            <form onSubmit={handleConnect} className="password-form">
              <div className="connection-info">
                <Server size={18} />
                <span>
                  Connecting to: {connectionInfo.ip}:{connectionInfo.port}
                </span>
              </div>

              <div className="form-group">
                <label>
                  <Lock size={18} />
                  Password Required
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the password for this share"
                  className="access-input"
                />
              </div>

              {error && (
                <div className="error-message">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="back-btn" onClick={() => setConnectionInfo(null)}>
                  Back
                </button>

                <button type="submit" className="connect-btn" disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <span className="spinner"></span>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Server size={18} />
                      Connect
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {isConnected && (
            <div className="connected-view">
              <div className="connection-info">
                <Server size={18} />
                <span>
                  Connected to shared file server
                </span>
                <button className="disconnect-btn" onClick={handleDisconnect}>
                  Disconnect
                </button>
              </div>

              <div className="files-list">
                <h3>Available Files</h3>

                {files.map((file) => (
                  <div className="file-item" key={file.id}>
                    <div className="file-info">
                      <div className="file-icon">{getFileIcon(file.type)}</div>
                      <div className="file-details">
                        <div className="file-name">{file.name}</div>
                        <div className="file-size">{file.size}</div>
                        {file.maxDownloads && (
                          <div className="file-downloads">
                            Downloads: {file.downloadCount} / {file.maxDownloads}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="file-actions">
                      <button className="download-btn" onClick={() => handleDownload(file.id)}>
                        {file.isText ? (
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
                    </div>
                  </div>
                ))}

                <div className="download-all">
                  <button className="download-all-btn" onClick={handleDownloadAll}>
                    <Download size={18} />
                    Download File
                  </button>
                </div>
              </div>

              <div className="share-info">
                <p>This file is being shared from: <strong>{connectionInfo.host}:{connectionInfo.port}</strong></p>
                <p className="security-note">
                  <Shield size={16} />
                  {connectionInfo.requiredPassword ? 'Password protected' : 'No password required'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="access-features">
          <div className="feature">
            <Key size={24} />
            <div>
              <h3>Secure Access</h3>
              <p>Access keys contain encrypted connection information</p>
            </div>
          </div>
          <div className="feature">
            <Server size={24} />
            <div>
              <h3>Local Network</h3>
              <p>Connect to files shared on your local network</p>
            </div>
          </div>
          <div className="feature">
            <Download size={24} />
            <div>
              <h3>Multiple Download Options</h3>
              <p>Download through the browser or using wget</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
