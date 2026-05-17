"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { FileText, Lock, Eye, EyeOff, Copy, Check } from "lucide-react"
import "../styles/TextViewer.css"
import CryptoJS from "crypto-js"

export default function TextViewerPage() {
  const router = useRouter()
  const [encryptedText, setEncryptedText] = useState("")
  const [hasPassword, setHasPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [decryptedText, setDecryptedText] = useState("")
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [returnUrl, setReturnUrl] = useState("/access")
  const [expired, setExpired] = useState(false)

  const handleDecrypt = useCallback(async (encrypted, pwd) => {
    setIsDecrypting(true)
    setError("")

    try {
      const key = pwd || "vaultdrop-anon"
      const bytes = CryptoJS.AES.decrypt(encrypted, key)
      const result = bytes.toString(CryptoJS.enc.Utf8)
      if (!result) {
        throw new Error("Invalid password or corrupted data")
      }
      setDecryptedText(result)
    } catch (err) {
      console.error("Decryption error:", err)
      setError("Failed to decrypt message. Invalid password or corrupted data.")
    } finally {
      setIsDecrypting(false)
    }
  }, [])

  useEffect(() => {
    // Get encrypted text from session storage
    const encrypted = sessionStorage.getItem('encrypted-text')
    const hasPwd = sessionStorage.getItem('text-has-password') === 'true'
    const pwd = sessionStorage.getItem('text-password') || ''
    const accessCode = sessionStorage.getItem('text-access-code') || ''
    const locHost = sessionStorage.getItem('locshare-host') || ''
    const locPort = sessionStorage.getItem('locshare-port') || ''
    const autoClearSeconds = parseInt(sessionStorage.getItem('locshare-auto-clear') || '0', 10)
    const openedAt = parseInt(sessionStorage.getItem('locshare-opened-at') || '0', 10)

    if (!encrypted) {
      router.push('/access')
      return
    }

    if (autoClearSeconds > 0 && openedAt > 0) {
      const expiresAt = openedAt + autoClearSeconds * 1000
      if (Date.now() >= expiresAt) {
        sessionStorage.removeItem('encrypted-text')
        sessionStorage.removeItem('text-has-password')
        sessionStorage.removeItem('text-password')
        sessionStorage.removeItem('locshare-opened-at')
        setExpired(true)
        return
      }
    }

    setEncryptedText(encrypted)
    setHasPassword(hasPwd)
    setPassword(pwd)
    
    // Set return URL to the download page if we have an access code
    if (accessCode) {
      setReturnUrl(`/download/${accessCode}`)
    }

    const verifyLocalSession = async () => {
      if (!locHost || !locPort) return true
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000)
        const res = await fetch(`http://${locHost}:${locPort}/ping`, { signal: controller.signal })
        clearTimeout(timeoutId)
        if (!res.ok) throw new Error('Ping failed')
        return true
      } catch {
        return false
      }
    }

    verifyLocalSession().then((ok) => {
      if (!ok) {
        sessionStorage.removeItem('encrypted-text')
        sessionStorage.removeItem('text-has-password')
        sessionStorage.removeItem('text-password')
        sessionStorage.removeItem('locshare-opened-at')
        setExpired(true)
        return
      }

      if (!hasPwd || pwd) {
        handleDecrypt(encrypted, pwd)
      }
    })

    if (autoClearSeconds > 0) {
      const remaining = Math.max(0, (openedAt + autoClearSeconds * 1000) - Date.now())
      const timer = setTimeout(() => {
        sessionStorage.removeItem('encrypted-text')
        sessionStorage.removeItem('text-has-password')
        sessionStorage.removeItem('text-password')
        sessionStorage.removeItem('locshare-opened-at')
        setExpired(true)
      }, remaining)
      return () => clearTimeout(timer)
    }

    // Don't cleanup immediately - only on unmount
    // Removed the cleanup function that was causing issues
  }, [router, handleDecrypt])

  const handleSubmit = (e) => {
    e.preventDefault()
    handleDecrypt(encryptedText, password)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(decryptedText)
      .then(() => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      })
      .catch(err => {
        console.error("Failed to copy:", err)
      })
  }

  return (
    <div className="text-viewer-page">
      <main className="text-viewer-container">
        <div className="text-viewer-card">
          <div className="text-viewer-header">
            <div className="header-icon">
              <FileText size={48} />
            </div>
            <h1>Shared Message</h1>
            <p>View the encrypted text message shared with you</p>
          </div>

          {expired ? (
            <div className="error-message">
              This message is no longer available.
            </div>
          ) : !decryptedText ? (
            !isDecrypting && hasPassword && !password ? (
              // Show password form
              <form onSubmit={handleSubmit} className="password-form">
                <div className="password-notice">
                  <Lock size={20} />
                  <p>This message is password protected</p>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Enter Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError("")
                      }}
                      placeholder="Enter password to decrypt"
                      className="password-input"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="decrypt-btn"
                  disabled={isDecrypting || !password}
                >
                  {isDecrypting ? "Decrypting..." : "Decrypt & View"}
                </button>
              </form>
            ) : (
              // Auto-decrypting
              <div className="decrypting-state">
                <div className="spinner"></div>
                <p>Decrypting message...</p>
              </div>
            )
          ) : (
            // Show decrypted text
            <div className="decrypted-content">
              <div className="content-header">
                <h3>Message Content</h3>
                <button
                  className="copy-btn"
                  onClick={handleCopy}
                  title="Copy to clipboard"
                >
                  {isCopied ? <Check size={18} /> : <Copy size={18} />}
                  {isCopied ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="text-display">
                <pre>{decryptedText}</pre>
              </div>

              <div className="actions">
                <button
                  className="back-btn"
                  onClick={() => router.push(returnUrl)}
                >
                  Back to Access
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
