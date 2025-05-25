"use client"

import { useState, useRef, useEffect } from "react"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { Upload, Key, Shield, Wifi, Server } from "lucide-react"
import "../styles/LocSharePage.css"
import { uploadLocFile } from "../utils/api"

function LocSharePage() {
  const [files, setFiles] = useState([])
  const [password, setPassword] = useState("")
  const [localIp, setLocalIp] = useState("")
  const [port, setPort] = useState("8080")
  const [shareKey, setShareKey] = useState("")
  const [isSharing, setIsSharing] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const fileInputRef = useRef(null)

  // Get local IP address on component mount
  useEffect(() => {
    // This is a simplified way to get the local IP
    // In a real app, you would use a server-side approach or a library
    const getLocalIp = async () => {
      try {
        // Simulate getting the local IP
        // In a real implementation, you would use the actual network interfaces
        setLocalIp("192.168.1.100")
      } catch (error) {
        console.error("Failed to get local IP:", error)
        setLocalIp("127.0.0.1")
      }
    }

    getLocalIp()
  }, [])

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
  
    if (files.length === 0) return alert("Select a file first");
    if (!password) return alert("Set a password");
  
    setIsSharing(true);
  
    try {
      const res = await uploadLocFile(
        files[0],
        1800,
        password
      );
  
      if (res.accessKey) {
        setShareKey(res.accessKey);
        console.log("LocShare started:", res);
      } else {
        throw new Error("No access key returned");
      }
    } catch (err) {
      console.error("LocShare upload failed:", err);
      alert("Failed to start sharing");
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

  const handleStopSharing = () => {
    setIsSharing(false)
    setShareKey("")
    // In a real implementation, you would stop the local server here
    console.log("Stopped sharing files on local network")
  }

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
            <h1>Share Files Locally</h1>
            <p>Share files securely over your local network with key protection</p>
          </div>

          <form onSubmit={handleStartSharing}>
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

            <div className="share-options">
              <div className="option-group">
                <label className="option-label">
                  <Server size={18} />
                  Local IP Address:
                </label>
                <input
                  type="text"
                  value={localIp}
                  onChange={(e) => setLocalIp(e.target.value)}
                  className="option-input"
                  placeholder="Your local IP address"
                />
              </div>

              <div className="option-group">
                <label className="option-label">
                  <Wifi size={18} />
                  Port:
                </label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="option-input"
                  placeholder="Port number"
                />
              </div>

              <div className="option-group">
                <label className="option-label">
                  <Key size={18} />
                  Access Password:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="option-input"
                  placeholder="Set a password for access"
                  required
                />
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
              <h3>Your Secure Access Key</h3>
              <p>Share this key with people on your local network to give them access</p>

              <div className="key-box">
                <input type="text" value={shareKey} readOnly />
                <button onClick={handleCopyKey} className={`copy-btn ${isCopied ? "copied" : ""}`}>
                  {isCopied ? "Copied!" : "Copy Key"}
                </button>
              </div>

              <div className="sharing-info">
                <div className="info-item">
                  <Server size={16} />
                  <span>
                    Sharing on: {localIp}:{port}
                  </span>
                </div>
                <div className="info-item">
                  <Shield size={16} />
                  <span>Password protected</span>
                </div>
                <div className="info-item">
                  <Wifi size={16} />
                  <span>Local network only</span>
                </div>
              </div>

              <div className="instructions">
                <h4>How to access:</h4>
                <ol>
                  <li>Share this key with recipients on your local network</li>
                  <li>Recipients should go to the "Access Files" page</li>
                  <li>They'll enter this key to connect to your shared files</li>
                  <li>Keep this window open while sharing</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        <div className="locshare-features">
          <div className="feature">
            <Wifi size={24} />
            <div>
              <h3>Local Network Only</h3>
              <p>Files are shared only within your local network for enhanced security</p>
            </div>
          </div>
          <div className="feature">
            <Key size={24} />
            <div>
              <h3>Key Protection</h3>
              <p>Access keys contain encrypted connection information</p>
            </div>
          </div>
          <div className="feature">
            <Shield size={24} />
            <div>
              <h3>Password Security</h3>
              <p>Additional password protection for your shared files</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default LocSharePage
