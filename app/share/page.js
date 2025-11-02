"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { Upload, Clock, Link, Shield, Eye, Lock, FileText } from "lucide-react"
import "../styles/SharePage.css"
import { uploadAnonFile } from "../utils/api"
import { encryptText } from "../utils/crypto"

export default function SharePage() {
  const router = useRouter()
  const [shareMode, setShareMode] = useState("file") // "file" or "text"
  const [files, setFiles] = useState([])
  const [textMessage, setTextMessage] = useState("")
  const [availability, setAvailability] = useState("1")
  const [password, setPassword] = useState("")
  const [usePassword, setUsePassword] = useState(false)
  const [maxDownloads, setMaxDownloads] = useState("")
  const [useMaxDownloads, setUseMaxDownloads] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef(null)

  // Protect this page - only accessible in dark theme (AnonShare)
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "dark"
    if (theme === "light") {
      // If in light mode (LocShare), redirect to LocShare page
      router.push("/locshare")
    }

    const handleThemeChange = () => {
      const newTheme = localStorage.getItem("theme") || "dark"
      if (newTheme === "light") {
        router.push("/locshare")
      }
    }

    const interval = setInterval(handleThemeChange, 100)
    return () => clearInterval(interval)
  }, [router])

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

  const handleGenerateLink = async (e) => {
    e.preventDefault();

    // Validate based on mode
    if (shareMode === "file" && files.length === 0) {
      alert("Please select at least one file to share");
      return;
    }

    if (shareMode === "text" && !textMessage.trim()) {
      alert("Please enter a message to share");
      return;
    }

    setIsLoading(true);

    try {
      let res;
      
      if (shareMode === "file") {
        // File upload mode
        res = await uploadAnonFile(
          files[0],
          parseInt(availability) * 3600,
          usePassword ? password : '',
          useMaxDownloads ? maxDownloads : null
        );
      } else {
        // Text mode - encrypt if password is set
        let messageToShare = textMessage;
        if (usePassword && password) {
          messageToShare = await encryptText(textMessage, password);
        }
        
        // Upload encrypted text
        res = await uploadAnonFile(
          null, // No file
          parseInt(availability) * 3600,
          usePassword ? password : '',
          useMaxDownloads ? maxDownloads : null,
          messageToShare // Pass encrypted text
        );
      }

      // Redirect to session page with only the access code
      window.location.href = res.sessionUrl;

    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }

    setIsLoading(false);
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
    <div className="share-page">
      <Header />
      <main className="share-container">
        <div className="share-card">
          <div className="share-header">
            <h1>Share Files Securely</h1>
            <p>Files are available for a limited time only. No accounts needed.</p>
          </div>

          <form onSubmit={handleGenerateLink}>
            {/* Mode Toggle */}
            <div className="mode-toggle">
              <button
                type="button"
                className={`mode-btn ${shareMode === "file" ? "active" : ""}`}
                onClick={() => setShareMode("file")}
              >
                <Upload size={18} />
                File Upload
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
              >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="file-input" id="file-input" />

              {files.length > 0 ? (
                <div className="selected-files">
                  <div className="files-header">
                    <h3>Selected Files ({files.length})</h3>
                    <button type="button" className="clear-btn" onClick={clearFiles}>
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
                <div className="drop-message"
                  onClick={() => fileInputRef.current.click()}
                >
                  <Upload size={48} className="upload-icon" />
                  <p>Drag & drop files here or click to browse</p>
                  <span className="file-types">Supports all file types up to 2GB</span>
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
                  {usePassword && password && (
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
              <div className="option-group">
                <label className="option-label">
                  <Clock size={18} />
                  Available for:
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="option-select"
                >
                  <option value="1">1 Hour</option>
                  <option value="24">24 Hours</option>
                  <option value="72">3 Days</option>
                  <option value="168">7 Days</option>
                  <option value="720">30 Days</option>
                </select>
              </div>

              <div className="option-group">
                <div className="option-checkbox">
                  <input
                    type="checkbox"
                    id="password-protection"
                    checked={usePassword}
                    onChange={() => setUsePassword(!usePassword)}
                  />
                  <label htmlFor="password-protection" className="checkbox-label">
                    <Lock size={18} />
                    Password Protection
                  </label>
                </div>

                {usePassword && (
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="password-input"
                  />
                )}
              </div>

              <div className="option-group">
                <div className="option-checkbox">
                  <input
                    type="checkbox"
                    id="max-downloads"
                    checked={useMaxDownloads}
                    onChange={() => setUseMaxDownloads(!useMaxDownloads)}
                  />
                  <label htmlFor="max-downloads" className="checkbox-label">
                    <Eye size={18} />
                    Limit Downloads
                  </label>
                </div>

                {useMaxDownloads && (
                  <input
                    type="number"
                    value={maxDownloads}
                    onChange={(e) => setMaxDownloads(e.target.value)}
                    placeholder="Max number of downloads"
                    className="downloads-input"
                    min="1"
                  />
                )}
              </div>
            </div>

            <button type="submit" className={`generate-btn ${isLoading ? "loading" : ""}`} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Generating...
                </>
              ) : (
                <>
                  <Link size={18} />
                  Generate Share Link
                </>
              )}
            </button>
          </form>

        </div>

        <div className="share-features">
          <div className="feature">
            <Shield size={24} />
            <div>
              <h3>Secure & Private</h3>
              <p>End-to-end encryption keeps your files safe</p>
            </div>
          </div>
          <div className="feature">
            <Clock size={24} />
            <div>
              <h3>Time-Limited</h3>
              <p>Files automatically expire after your chosen period</p>
            </div>
          </div>
          <div className="feature">
            <Lock size={24} />
            <div>
              <h3>Password Protection</h3>
              <p>Add an extra layer of security with passwords</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
