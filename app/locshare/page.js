"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { Upload, Key, Shield, Wifi, Server, Download, Clock, FileText } from "lucide-react"
import "../styles/LocSharePage.css"
import { startLocalServer, stopLocalServer, checkPort, getServerStats } from "../utils/api"
import { API_BASE } from "../config"
import { encryptText } from "../utils/crypto"

export default function LocSharePage() {
  const router = useRouter()
  const [shareMode, setShareMode] = useState("file") // "file" or "text"
  const [files, setFiles] = useState([])
  const [textMessage, setTextMessage] = useState("")
  const [password, setPassword] = useState("")
  const [localIp, setLocalIp] = useState("")
  const [port, setPort] = useState("8080")
  const [portAvailable, setPortAvailable] = useState(null)
  const [shareKey, setShareKey] = useState("")
  const [isSharing, setIsSharing] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [activePort, setActivePort] = useState(null)
  const [maxDownloads, setMaxDownloads] = useState("")
  const [downloadCount, setDownloadCount] = useState(0)
  const [downloadLimitReached, setDownloadLimitReached] = useState(false)
  const [expireTime, setExpireTime] = useState("30") // in minutes
  const [sessionEndTime, setSessionEndTime] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const fileInputRef = useRef(null)

  // Protect this page - only accessible in light theme (LocShare)
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "dark"
    if (theme === "dark") {
      // If in dark mode (AnonShare), redirect to AnonShare page
      router.push("/share")
    }

    const handleThemeChange = () => {
      const newTheme = localStorage.getItem("theme") || "dark"
      if (newTheme === "dark") {
        router.push("/share")
      }
    }

    const interval = setInterval(handleThemeChange, 100)
    return () => clearInterval(interval)
  }, [router])

  // Get local IP address on component mount
  useEffect(() => {
    const fetchLocalIP = async () => {
      try {
        const response = await fetch(`${API_BASE}/local-server/local-ip`);
        if (response.ok) {
          const data = await response.json();
          setLocalIp(data.localIP);
          console.log('Detected local IP:', data.localIP);
          console.log('Available interfaces:', data.allInterfaces);
        } else {
          setLocalIp("Unable to detect");
        }
      } catch (error) {
        console.error('Failed to get local IP:', error);
        setLocalIp("Unable to detect");
      }
    };
    
    fetchLocalIP();
  }, [])

  // Check port availability when user changes it
  useEffect(() => {
    const checkPortAvailability = async () => {
      if (port && !isNaN(port) && port >= 1024 && port <= 65535) {
        try {
          const result = await checkPort(parseInt(port))
          setPortAvailable(result.available)
        } catch (error) {
          console.error("Failed to check port:", error)
          setPortAvailable(null)
        }
      } else {
        setPortAvailable(null)
      }
    }

    const debounce = setTimeout(checkPortAvailability, 500)
    return () => clearTimeout(debounce)
  }, [port])

  // Cleanup: stop server when component unmounts
  useEffect(() => {
    return () => {
      if (activePort) {
        stopLocalServer(activePort).catch(err => 
          console.error("Failed to cleanup server:", err)
        );
      }
    };
  }, [activePort])

  // Poll server stats while sharing
  useEffect(() => {
    if (!isSharing || !activePort) return;

    const pollStats = async () => {
      try {
        const stats = await getServerStats(activePort);
        setDownloadCount(stats.downloadCount);
        
        // Check if limit reached
        if (stats.maxDownloads !== null && stats.downloadCount >= stats.maxDownloads) {
          setDownloadLimitReached(true);
          // Auto-stop after a brief delay
          setTimeout(() => {
            handleStopSharing();
          }, 2000);
        }
      } catch (error) {
        console.error("Failed to get server stats:", error);
        // If server is no longer running, stop sharing
        if (error.message.includes('not found')) {
          setIsSharing(false);
          setShareKey("");
          setActivePort(null);
          setSessionEndTime(null);
          setTimeRemaining(null);
        }
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(pollStats, 2000);
    pollStats(); // Initial poll

    return () => clearInterval(interval);
  }, [isSharing, activePort, handleStopSharing])

  // Timer countdown for session expiry
  useEffect(() => {
    if (!isSharing || !sessionEndTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = sessionEndTime - now;

      if (remaining <= 0) {
        // Session expired
        handleStopSharing();
        return;
      }

      setTimeRemaining(remaining);
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isSharing, sessionEndTime, handleStopSharing])

  const formatTimeRemaining = (ms) => {
    if (!ms) return '00:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const fileArray = Array.from(e.target.files)
      setFiles(fileArray)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.add("drag-over")
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove("drag-over")
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove("drag-over")

    if (e.dataTransfer.files.length > 0) {
      const fileArray = Array.from(e.dataTransfer.files)
      setFiles(fileArray)
    }
  }

  const generateShareKey = () => {
    // Create a key with format: ip:port:password:fileId
    const fileId = Math.random().toString(36).substring(2, 10)
    return btoa(`${localIp}:${port}:${password}:${fileId}`)
  }

  const handleStartSharing = async (e) => {
    e.preventDefault();
  
    // Validate based on mode
    if (shareMode === "file" && files.length === 0) {
      alert("Select a file first");
      return;
    }

    if (shareMode === "text" && !textMessage.trim()) {
      alert("Enter a message first");
      return;
    }

    if (!port || isNaN(port) || port < 1024 || port > 65535) {
      alert("Please enter a valid port number (1024-65535)");
      return;
    }

    if (portAvailable === false) {
      alert("This port is already in use. Please choose a different port.");
      return;
    }
  
    setIsSharing(true);
  
    try {
      let res;
      
      if (shareMode === "file") {
        // File sharing mode
        res = await startLocalServer(
          files[0],
          parseInt(port),
          password || null,
          maxDownloads ? parseInt(maxDownloads) : null
        );
      } else {
        // Text sharing mode - encrypt if password is set
        let messageToShare = textMessage;
        if (password) {
          messageToShare = await encryptText(textMessage, password);
        }
        
        // Send encrypted text to backend
        res = await startLocalServer(
          null, // No file
          parseInt(port),
          password || null,
          maxDownloads ? parseInt(maxDownloads) : null,
          messageToShare // Pass encrypted text
        );
      }
  
      if (res.accessKey) {
        setShareKey(res.accessKey);
        setLocalIp(res.localIP);
        setActivePort(res.port);
        setDownloadCount(0);
        setDownloadLimitReached(false);
        
        // Set session end time
        const expiryMinutes = parseInt(expireTime) || 30;
        const endTime = Date.now() + (expiryMinutes * 60 * 1000);
        setSessionEndTime(endTime);
        setTimeRemaining(expiryMinutes * 60 * 1000);
        
        console.log("Local server started:", res);
        console.log(`Session will expire in ${expiryMinutes} minutes`);
      } else {
        throw new Error("No access key returned");
      }
    } catch (err) {
      console.error("Failed to start local server:", err);
      alert("Failed to start sharing: " + err.message);
      setIsSharing(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard
      .writeText(shareKey)
      .then(() => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      })
      .catch((err) => {
        console.error("Failed to copy key:", err)
      })
  }

  const handleStopSharing = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsSharing(false);
    setShareKey("");
    setDownloadCount(0);
    setDownloadLimitReached(false);
    setSessionEndTime(null);
    setTimeRemaining(null);
    
    try {
      if (activePort) {
        await stopLocalServer(activePort);
        setActivePort(null);
      }
    } catch (error) {
      console.error("Failed to stop server:", error);
      // Don't show error to user - just log it
      // UI already shows as stopped
    }
  }, [activePort]);

  const handleCopyLink = () => {
    const link = `http://${localIp}:5173/access/qr?key=${encodeURIComponent(shareKey)}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
      });
  };

  const clearFiles = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="locshare-page">
      <Header />
      <main className="locshare-container">
        <div className="locshare-card">
          <div className="locshare-header">
            <h1>Share Files on Your Network</h1>
            <p>Upload files to share with people on your network using a secure access key</p>
          </div>

          <form onSubmit={handleStartSharing}>
            {/* Mode Toggle */}
            <div className="mode-toggle">
              <button
                type="button"
                className={`mode-btn ${shareMode === "file" ? "active" : ""}`}
                onClick={() => setShareMode("file")}
              >
                <Upload size={18} />
                File Sharing
              </button>
              <button
                type="button"
                className={`mode-btn ${shareMode === "text" ? "active" : ""}`}
                onClick={() => setShareMode("text")}
              >
                <FileText size={18} />
                Text Message
              </button>
            </div>

            {/* File Upload Area */}
            {shareMode === "file" && (
              <div
                className="file-drop-area"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="file-input" />

              {files.length > 0 ? (
                <div className="selected-files">
                  <div className="files-header">
                    <h3>Selected Files ({files.length})</h3>
                    <button type="button" className="clear-btn" onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        clearFiles(e);
                      }}>
                      Clear
                    </button>
                  </div>
                  <ul className="file-list">
                    {files.map((file, index) => (
                      <li key={index} className="file-item">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="drop-message">
                  <Upload size={48} className="upload-icon" />
                  <p>Drag & drop files here or click to browse</p>
                  <span className="file-types">Shares directly over your local network</span>
                </div>
              )}
            </div>
            )}

            {/* Text Message Area */}
            {shareMode === "text" && (
              <div className="text-message-area">
                <div className="text-header">
                  <FileText size={24} />
                  <h3>Enter Your Message</h3>
                </div>
                <textarea
                  className="text-input"
                  placeholder="Type your message here... (will be encrypted if password is set)"
                  value={textMessage}
                  onChange={(e) => setTextMessage(e.target.value)}
                  rows={10}
                />
                <div className="text-info">
                  {password && (
                    <span className="encryption-notice">
                      <Shield size={14} />
                      Message will be encrypted
                    </span>
                  )}
                  <span className="char-count">
                    {textMessage.length} characters
                  </span>
                </div>
              </div>
            )}

            <div className="share-options">
              <div className="ip-display">
                <Wifi size={16} />
                <span className="ip-label">Your Local IP:</span>
                <span className="ip-value">{localIp}</span>
              </div>

              <div className="option-group">
                <label className="option-label">
                  <Server size={18} />
                  Port Number:
                </label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="option-input"
                  placeholder="Enter port (1024-65535)"
                  min="1024"
                  max="65535"
                  disabled={isSharing}
                />
                {portAvailable === false && (
                  <span className="port-error">⚠️ Port already in use</span>
                )}
                {portAvailable === true && (
                  <span className="port-success">✓ Port available</span>
                )}
              </div>

              <div className="option-group">
                <label className="option-label">
                  <Key size={18} />
                  Access Password (Optional):
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="option-input"
                  placeholder="Set a password for access (leave empty for no password)"
                  disabled={isSharing}
                />
              </div>

              <div className="option-group">
                <label className="option-label">
                  <Download size={18} />
                  Download Limit (Optional):
                </label>
                <input
                  type="number"
                  value={maxDownloads}
                  onChange={(e) => setMaxDownloads(e.target.value)}
                  className="option-input"
                  placeholder="Max downloads (leave empty for unlimited)"
                  min="1"
                  disabled={isSharing}
                />
              </div>

              <div className="option-group">
                <label className="option-label">
                  <Clock size={18} />
                  Session Duration:
                </label>
                <select
                  value={expireTime}
                  onChange={(e) => setExpireTime(e.target.value)}
                  className="option-input"
                  disabled={isSharing}
                >
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                  <option value="360">6 hours</option>
                </select>
              </div>
            </div>

            {!isSharing ? (
              <button type="submit" className="start-sharing-btn">
                <Wifi size={18} />
                Start Local Sharing
              </button>
            ) : (
              <button type="button" className="stop-sharing-btn" onClick={handleStopSharing}>
                <Wifi size={18} />
                Stop Sharing
              </button>
            )}
          </form>

          {isSharing && (
            <div className="share-key-container">
              <h3>Share Access Link</h3>
              <p>Send this link to people on your local network to give them access</p>

              {/* Download Stats */}
              <div className="download-stats">
                <div className="stat-item">
                  <Clock size={20} />
                  <span className="stat-label">Time Remaining:</span>
                  <span className="stat-value timer-value">
                    {formatTimeRemaining(timeRemaining)}
                  </span>
                </div>
                <div className="stat-item">
                  <Download size={20} />
                  <span className="stat-label">Downloads:</span>
                  <span className="stat-value">
                    {downloadCount}
                    {maxDownloads && ` / ${maxDownloads}`}
                  </span>
                </div>
                {downloadLimitReached && (
                  <div className="limit-reached-notice">
                    ✓ Download limit reached! Server will stop automatically.
                  </div>
                )}
              </div>

              <div className="key-box">
                <input 
                  type="text" 
                  value={`http://${localIp}:5173/access/qr?key=${encodeURIComponent(shareKey)}`} 
                  readOnly 
                />
                <button onClick={handleCopyLink} className={`copy-btn ${isCopied ? "copied" : ""}`}>
                  {isCopied ? "Copied!" : "Copy Link"}
                </button>
              </div>

              {/* QR Code Section */}
              <div className="qr-code-section">
                <h4>Or Scan QR Code</h4>
                <p className="qr-description">Recipients can scan this to instantly connect</p>
                <div className="qr-code-wrapper">
                  <QRCodeSVG 
                    value={`http://${localIp}:5173/access/qr?key=${encodeURIComponent(shareKey)}`}
                    size={200}
                    level="H"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
                <p className="qr-note">Scan to auto-connect • Recipient must be on same network</p>
              </div>

              <div className="sharing-info">
                <div className="info-item">
                  <Server size={16} />
                  <span>Local server: {localIp}:{activePort}</span>
                </div>
                <div className="info-item">
                  <Shield size={16} />
                  <span>{password ? 'Password protected' : 'No password'}</span>
                </div>
                <div className="info-item">
                  <Wifi size={16} />
                  <span>Sharing from your device</span>
                </div>
              </div>

              <div className="instructions">
                <h4>How to share:</h4>
                <ol>
                  <li><strong>Option 1 - Share Link:</strong> Copy and send the link above via WhatsApp, Telegram, email, etc.</li>
                  <li><strong>Option 2 - QR Code:</strong> Show the QR code to recipients - they scan it to instantly connect</li>
                  <li>Recipients click the link or scan the QR code</li>
                  <li>They will be automatically redirected and connected to your device at {localIp}:{activePort}</li>
                  <li>Recipients must be on the same WiFi network as you</li>
                  <li>Keep this page open while sharing - closing it will stop the server</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        <div className="locshare-features">
          <div className="feature">
            <Wifi size={24} />
            <div>
              <h3>Direct Network Sharing</h3>
              <p>Start a local server on your device - recipients connect directly to you</p>
            </div>
          </div>
          <div className="feature">
            <Server size={24} />
            <div>
              <h3>Custom Port</h3>
              <p>Choose your own port number between 1024 and 65535</p>
            </div>
          </div>
          <div className="feature">
            <Shield size={24} />
            <div>
              <h3>Optional Password</h3>
              <p>Add an extra layer of security with password protection</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
