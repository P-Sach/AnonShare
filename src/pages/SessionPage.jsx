"use client"

import { useState, useEffect, useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { Clock, Copy, Share2, XCircle, CheckCircle, AlertTriangle } from "lucide-react"
import "../styles/SessionPage.css"
import { endSharingSession, checkSessionStatus } from "../utils/api";

function SessionPage() {
  const [timeRemaining, setTimeRemaining] = useState(null) 
  const [copied, setCopied] = useState(false)
  const [sessionData, setSessionData] = useState({ downloadUrl: "", qrCode: "", expiresAt: null, createdAt: null, fileCount: 0, totalSize: 0, downloads: 0, maxDownloads: null, sessionId: null });
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [sessionCancelled, setSessionCancelled] = useState(false)
  const timerRef = useRef(null)
  const confirmationTimeoutRef = useRef(null);
  
  useEffect(() => {
    const verifySession = async () => {
      try {
        const query = new URLSearchParams(window.location.search);
        const rawData = query.get("data");
        
        if (!rawData) {
          setError("No session data found.");
          setInitialLoadComplete(true);
          return;
        }
  
        const parsed = JSON.parse(decodeURIComponent(rawData));
        
        // First try to get sessionId from parsed data
        let sessionId = parsed.sessionId;
        
        // If no sessionId in data, try to extract from downloadUrl
        if (!sessionId && parsed.downloadUrl) {
          try {
            const url = new URL(parsed.downloadUrl, window.location.origin);
            const pathSegments = url.pathname.split('/').filter(Boolean);
            sessionId = pathSegments.pop();
          } catch (e) {
            console.error("Error parsing download URL:", e);
          }
        }
  
        if (!sessionId) {
          setError("Invalid session data - missing session ID");
          setInitialLoadComplete(true);
          return;
        }
  
        // Always verify session status with server first
        const sessionStatus = await checkSessionStatus(sessionId);
        
        if (sessionStatus.error || sessionStatus.cancelled || sessionStatus.expired) {
          setSessionCancelled(true);
          setTimeRemaining(0);
          setError(sessionStatus.error || "Session has been cancelled or expired");
        } else {
          // Only set session data if server confirms it's valid
          setSessionData(prev => ({ 
            ...prev, 
            ...parsed, 
            sessionId,
            expiresAt: sessionStatus.expiresAt || parsed.expiresAt,
            downloads: sessionStatus.downloads || parsed.downloads
          }));
        }
      } catch (err) {
        console.error("Session verification failed:", err);
        setError("Failed to verify session status");
      } finally {
        setInitialLoadComplete(true);
      }
    };
  
    verifySession();
    
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(confirmationTimeoutRef.current);
    };
  }, []);

  
  useEffect(() => {
     if (!initialLoadComplete || error || sessionCancelled || !sessionData.expiresAt) {
      if (initialLoadComplete && !sessionCancelled && !error && !sessionData.expiresAt) {
          console.log("Session loaded but has no expiry date. Setting timeRemaining to 0.");
          setTimeRemaining(0); // Treat as immediately expired if no date
      }
      return; // Don't start timer if cancelled, error, or no expiry
    }

  // Calculate the initial remaining time based on expiresAt
  const expiresAtTimestamp = new Date(sessionData.expiresAt).getTime();
  const now = Date.now();
  const initialRemainingSeconds = Math.max(0, Math.floor((expiresAtTimestamp - now) / 1000));

  setTimeRemaining(initialRemainingSeconds); // Set the calculated time

  // Clear any existing interval before starting a new one
  clearInterval(timerRef.current);
  clearTimeout(confirmationTimeoutRef.current); // Clear existing confirmation timeout

  // Only start the interval if there's time remaining
  if (initialRemainingSeconds > 0) {
    timerRef.current = setInterval(() => {
      // Use functional update to safely decrement
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) { // Check prev state directly
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Show confirmation toast only if the session just started (e.g., initialRemaining > a threshold?)
    // Or maybe show it regardless if it's newly loaded? Let's keep it simple for now.
     if (!sessionCancelled) { // Avoid showing toast if session was cancelled immediately
       setShowConfirmation(true);
       confirmationTimeoutRef.current = setTimeout(() => {
         setShowConfirmation(false);
       }, 5000);
     }

  } else {
      console.log("Timer Effect: Initial time is zero or negative. Not starting interval.");
      // If time is already 0 or less when calculated, ensure state is 0
      setTimeRemaining(0);
  }
  // Depend on expiresAt and initialLoadComplete. Also add sessionCancelled to stop toast if cancelled.
}, [sessionData.expiresAt, initialLoadComplete, sessionCancelled, error]);

  const formatTime = (seconds) => {
    if (seconds === null || typeof seconds === 'undefined') return "Calculating...";
    if (seconds <= 0) return "00:00"; // Show 00:00 when expired
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours > 0 ? `${hours}:` : ""}${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  const formatFileSize = (bytes) => {
    if (bytes === null || typeof bytes === 'undefined' || bytes < 0) return "N/A";
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  

  const handleCopy = () => {
    if (!sessionData.downloadUrl) return;
    navigator.clipboard.writeText(sessionData.downloadUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        alert("Failed to copy link to clipboard."); // User feedback
      });
  }

  const handleCancelSession = async () => {
    // Ask for confirmation first
    if (!window.confirm("Are you sure you want to cancel this sharing session? This action cannot be undone.")) {
        console.log("[Cancel] Aborted by user.");
        return;
    }

    console.log("[Cancel] Confirmed by user. Current state:", { sessionCancelled, timeRemaining });
    console.log("[Cancel] Clearing timer interval.");
    clearInterval(timerRef.current); // Stop the timer update

    // Get sessionId - prioritize sessionData.sessionId if it exists, otherwise extract
    let sessionId = sessionData.sessionId;
    if (!sessionId && sessionData.downloadUrl && typeof sessionData.downloadUrl === 'string') {
      const downloadPath = sessionData.downloadUrl;
      console.log("[Cancel] Extracting sessionId from fallback path:", downloadPath);
      if (downloadPath.startsWith('/')) {
           try {
              const pathSegments = downloadPath.split('/').filter(segment => segment.length > 0);
              sessionId = pathSegments.pop() || null;
              if (!sessionId) console.warn("[Cancel] Extracted empty sessionId from path:", downloadPath);
          } catch (e) {
               console.error("[Cancel] Error splitting path:", downloadPath, e);
          }
      } else {
          // Optional: Fallback for absolute URLs if needed
          console.warn("[Cancel] Fallback downloadUrl does not start with '/', attempting URL parse:", downloadPath);
           try {
              const url = new URL(downloadPath);
              const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);
              sessionId = pathSegments.pop() || null;
          } catch (urlError) {
              console.error("[Cancel] Error extracting sessionId (neither path nor valid URL?):", downloadPath, urlError);
          }
      }
  }

  if (!sessionId) {
      console.error("[Cancel] Cannot proceed: sessionId is missing or could not be extracted.");
      alert("Error: Session ID is missing. Cannot cancel session.");
      // setSessionCancelled(true); // Optionally cancel UI only if needed
      // setTimeRemaining(0);
      return;
  }

  console.log(`[Cancel] Attempting to call endSharingSession API for sessionId: ${sessionId}`);
  try {
      await endSharingSession(sessionId);
      console.log(`[Cancel] API call for sessionId ${sessionId} successful.`);
      console.log("[Cancel] Setting sessionCancelled = true and timeRemaining = 0");
      setSessionCancelled(true);
      setTimeRemaining(0);
  } catch (err) {
      console.error(`[Cancel] API call failed for sessionId ${sessionId}:`, err);
      alert("Failed to cancel the session on the server. It might expire automatically later. Cancelling the view locally.");
      console.log("[Cancel] API failed, but setting sessionCancelled = true and timeRemaining = 0 for UI");
      setSessionCancelled(true);
      setTimeRemaining(0);
  }
};

  const isSessionExpired = initialLoadComplete && timeRemaining === 0;
  const isInvalidOrError = initialLoadComplete && (error || (!sessionData.expiresAt && !sessionCancelled)); // Handle missing data/error cases
  const isExpiredOrCancelled = sessionCancelled || isSessionExpired;
  if (isInvalidOrError) {
    return (
        <div className="session-page">
            <Header />
            <main className="session-container">
                <div className="session-card">
                    <div className="session-cancelled">
                        <AlertTriangle size={60} className="cancelled-icon" />
                        <h1>Session Unavailable</h1>
                        <p>{error || "This session data is invalid or missing critical information (like expiry date)."}</p>
                        <a href="/share" className="new-share-btn">
                            Start a New Share
                        </a>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}

  if (isExpiredOrCancelled) {
    const reason = sessionCancelled ? "Cancelled" : "Expired";
    const message = sessionCancelled
      ? "You have cancelled it."
      : "The time limit has been reached.";
    return (
      <div className="session-page">
        <Header />
        <main className="session-container">
          <div className="session-card">
            <div className="session-cancelled">
              <AlertTriangle size={60} className="cancelled-icon" />
              <h1>Session {reason}</h1>
              <p>
                This file sharing session is no longer available.{" "}
                {message}
              </p>
              <a href="/share" className="new-share-btn">
                Share New Files
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="session-page">
      <Header />
      <main className="session-container">
        <div className="session-card">
          <div className="session-header">
            <h1>Share this Session</h1>
            <p>Scan the QR code or share the link below. The session will expire automatically.</p>
          </div>

          <div className="session-content">
            <div className="qr-container">
              {sessionData.downloadUrl ? (
                <QRCodeSVG value={sessionData.downloadUrl} size={200} bgColor={"#ffffff"} fgColor={"#000000"} level={"H"} />
              ) : (
                <div className="qr-placeholder">Generating QR...</div> // Placeholder
              )}
            </div>

            <div className="session-info">
              <div className="time-remaining">
                <Clock size={20} />
                <span>Time remaining: </span>
                <span className="countdown">{formatTime(timeRemaining)}</span>
              </div>

              <div className="session-url-container">
                <input type="text" value={sessionData.downloadUrl} readOnly className="session-url" />
                <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}
                disabled={!sessionData.downloadUrl || copied}>
                  {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="share-options">
                <button className="share-btn">
                  <Share2 size={18} />
                  Share via Email
                </button>
                <button className="cancel-btn" onClick={handleCancelSession}>
                  <XCircle size={18} />
                  Cancel Session
                </button>
              </div>
            </div>
          </div>

          {showConfirmation && (
            <div className="confirmation-toast">
              <CheckCircle size={18} />
              Session created! Share the link or QR code with recipients.
            </div>
          )}
        </div>

        <div className="session-details">
          <h2>Session Details</h2>
          <div className="details-grid">
            <div className="detail-item">
              <h3>Files Shared</h3>
              <p>
              {sessionData.fileCount || 1} file
              {sessionData.fileCount !== 1 ? "s" : ""}
              {sessionData.totalSize ? ` (${formatFileSize(sessionData.totalSize)})` : ""}
              </p>
            </div>
            <div className="detail-item">
              <h3>Created</h3>
              <p>{sessionData.createdAt
                  ? new Date(sessionData.createdAt).toLocaleString()
                  : "Just now"}
                </p>
            </div>
            <div className="detail-item">
              <h3>Expires</h3>
              <p>
                  {sessionData.expiresAt
                    ? new Date(sessionData.expiresAt).toLocaleString()
                    : "Calculating..."}
                </p>
            </div>
            <div className="detail-item">
              <h3>Downloads</h3>
              <p>{sessionData.downloads || 0} of {sessionData.maxDownloads || "unlimited"}</p>            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default SessionPage
