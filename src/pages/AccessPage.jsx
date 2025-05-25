"use client"

import { useState } from "react"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { Key, Download, Server, Lock, FileText, AlertTriangle } from "lucide-react"
import "../styles/AccessPage.css"

function AccessPage() {
  const [accessKey, setAccessKey] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionInfo, setConnectionInfo] = useState(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [files, setFiles] = useState([])

  const handleVerifyKey = (e) => {
    e.preventDefault()
    setError("")

    if (!accessKey) {
      setError("Please enter an access key")
      return
    }

    setIsVerifying(true)

    // Simulate key verification
    setTimeout(() => {
      try {
        // Decode the base64 key
        const decodedKey = atob(accessKey)
        const [ip, port, requiredPassword, fileId] = decodedKey.split(":")

        setConnectionInfo({
          ip,
          port,
          fileId,
          requiredPassword,
        })

        setIsVerifying(false)

        // If there's no password required, connect immediately
        if (!requiredPassword) {
          handleConnect()
        }
      } catch (error) {
        setIsVerifying(false)
        setError("Invalid access key format")
        console.error("Error decoding key:", error)
      }
    }, 1500)
  }

  const handleConnect = (e) => {
    if (e) e.preventDefault()

    if (connectionInfo.requiredPassword && connectionInfo.requiredPassword !== password) {
      setError("Incorrect password")
      return
    }

    setIsVerifying(true)

    // Simulate connecting to the local server
    setTimeout(() => {
      // Simulate fetching file list
      const mockFiles = [
        { id: 1, name: "document.pdf", size: "2.4 MB", type: "pdf" },
        { id: 2, name: "image.jpg", size: "1.8 MB", type: "image" },
        { id: 3, name: "presentation.pptx", size: "4.2 MB", type: "document" },
      ]

      setFiles(mockFiles)
      setIsVerifying(false)
      setIsConnected(true)
      setError("")
    }, 2000)
  }

  const handleDownload = (fileId) => {
    // In a real implementation, this would use wget or a similar approach
    // to download the file from the local server
    console.log(`Downloading file ${fileId} from ${connectionInfo.ip}:${connectionInfo.port}`)

    // Simulate wget command
    const wgetCommand = `wget http://${connectionInfo.ip}:${connectionInfo.port}/files/${fileId}`
    console.log("Equivalent wget command:", wgetCommand)

    alert(`In a real implementation, this would download the file using:\n${wgetCommand}`)
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
  }

  return (
    <div className="access-page">
      <Header />
      <main className="access-container">
        <div className="access-card">
          <div className="access-header">
            <h1>Access Shared Files</h1>
            <p>Enter the access key to connect to locally shared files</p>
          </div>

          {!isConnected && !connectionInfo && (
            <form onSubmit={handleVerifyKey} className="access-form">
              <div className="form-group">
                <label>
                  <Key size={18} />
                  Access Key
                </label>
                <input
                  type="text"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Enter the access key provided by the sender"
                  className="access-input"
                />
              </div>

              {error && (
                <div className="error-message">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              <button type="submit" className="verify-btn" disabled={isVerifying}>
                {isVerifying ? (
                  <>
                    <span className="spinner"></span>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Key size={18} />
                    Verify Access Key
                  </>
                )}
              </button>
            </form>
          )}

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
                  Connected to: {connectionInfo.ip}:{connectionInfo.port}
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
                      </div>
                    </div>
                    <div className="file-actions">
                      <button className="download-btn" onClick={() => handleDownload(file.id)}>
                        <Download size={18} />
                        Download
                      </button>
                    </div>
                  </div>
                ))}

                <div className="download-all">
                  <button className="download-all-btn" onClick={handleDownloadAll}>
                    <Download size={18} />
                    Download All Files
                  </button>
                </div>
              </div>

              <div className="wget-info">
                <h4>Using wget:</h4>
                <p>You can also download these files using wget in your terminal:</p>
                <code>
                  wget http://{connectionInfo.ip}:{connectionInfo.port}/files/[file-id]
                </code>
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

export default AccessPage
