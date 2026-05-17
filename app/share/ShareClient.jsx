"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CryptoJS from "crypto-js";
import {
  AlertCircle,
  Check,
  Clock,
  Download,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Lock,
  Upload,
  Wifi,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { uploadWithRetry } from "../utils/uploadWithRetry";
import { API_BASE } from "../config";

const MAX_BYTES = 4 * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ShareClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");

  const [mode, setMode] = useState(initialTab === "local" ? "local" : "file");

  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);

  const [text, setText] = useState("");
  const [burnAfterRead, setBurnAfterRead] = useState(false);

  const [localFile, setLocalFile] = useState(null);
  const [localPort, setLocalPort] = useState("8765");
  const [localIp, setLocalIp] = useState("Detecting...");
  const [portAvailable, setPortAvailable] = useState(null);
  const [shareKey, setShareKey] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activePort, setActivePort] = useState(null);
  const [downloadCount, setDownloadCount] = useState(0);
  const [downloadLimitReached, setDownloadLimitReached] = useState(false);
  const [expireMinutes, setExpireMinutes] = useState("30");
  const [sessionEndTime, setSessionEndTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [autoClearEnabled, setAutoClearEnabled] = useState(false);
  const [autoClearSeconds, setAutoClearSeconds] = useState("60");

  const [expiry, setExpiry] = useState("86400");
  const [pwEnabled, setPwEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [dlEnabled, setDlEnabled] = useState(false);
  const [maxDownloads, setMaxDownloads] = useState("5");

  const [phase, setPhase] = useState("idle");
  const [loadMsg, setLoadMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState("");

  const fileRef = useRef(null);
  const localFileRef = useRef(null);

  const expiryLabels = useMemo(
    () => ({
      3600: "1 hour",
      86400: "24 hours",
      259200: "3 days",
      604800: "7 days",
      2592000: "30 days",
    }),
    []
  );

  useEffect(() => {
    if (mode !== "local") return;

    const detectLocalIP = async () => {
      try {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel("");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await new Promise((resolve) => {
          pc.onicecandidate = (event) => {
            if (!event.candidate) {
              resolve();
              return;
            }
            const ip = event.candidate.candidate.match(/(\d{1,3}\.){3}\d{1,3}/)?.[0];
            if (ip && !ip.startsWith("127.")) {
              setLocalIp(ip);
              resolve();
            }
          };
          setTimeout(resolve, 2000);
        });

        pc.close();
      } catch {
        setLocalIp("Could not detect — check network settings");
      }
    };

    detectLocalIP();
  }, [mode]);

  useEffect(() => {
    if (mode !== "local") return;

    const checkPortAvailability = async () => {
      if (!localPort || isNaN(localPort) || localPort < 1024 || localPort > 65535) {
        setPortAvailable(null);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/local-server/check-port/${localPort}`);
        const data = await res.json();
        setPortAvailable(Boolean(data.available));
      } catch {
        setPortAvailable(null);
      }
    };

    const debounce = setTimeout(checkPortAvailability, 400);
    return () => clearTimeout(debounce);
  }, [mode, localPort]);

  useEffect(() => {
    if (!isSharing || !activePort) return;

    const pollStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/local-server/stats/${activePort}`);
        if (!res.ok) throw new Error("Stats unavailable");
        const stats = await res.json();
        setDownloadCount(stats.downloadCount || 0);
        if (stats.maxDownloads !== null && stats.downloadCount >= stats.maxDownloads) {
          setDownloadLimitReached(true);
          setTimeout(() => {
            handleStopSharing();
          }, 2000);
        }
      } catch {
        setIsSharing(false);
        setShareKey("");
        setActivePort(null);
        setSessionEndTime(null);
        setTimeRemaining(null);
      }
    };

    const interval = setInterval(pollStats, 2000);
    pollStats();

    return () => clearInterval(interval);
  }, [isSharing, activePort, handleStopSharing]);

  useEffect(() => {
    if (!isSharing || !sessionEndTime) return;

    const updateTimer = () => {
      const remaining = sessionEndTime - Date.now();
      if (remaining <= 0) {
        handleStopSharing();
        return;
      }
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isSharing, sessionEndTime, handleStopSharing]);

  const setFileSafe = useCallback((selected) => {
    if (!selected) return;
    if (selected.size > MAX_BYTES) {
      setFileError(
        `"${selected.name}" is ${formatBytes(selected.size)}. Max 4 MB. Try compressing first.`
      );
      return;
    }
    setFileError("");
    setFile(selected);
  }, []);

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) setFileSafe(dropped);
  };

  const canSubmit = useMemo(() => {
    if (mode === "file") return !!file;
    if (mode === "text") return text.trim().length > 0;
    if (mode === "local") return true;
    return false;
  }, [mode, file, text]);

  const handleStopSharing = useCallback(async () => {
    setIsSharing(false);
    setShareKey("");
    setDownloadCount(0);
    setDownloadLimitReached(false);
    setSessionEndTime(null);
    setTimeRemaining(null);

    if (activePort) {
      try {
        await fetch(`${API_BASE}/local-server/stop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ port: activePort }),
        });
      } catch {
        // Ignore stop failures; UI already resets.
      }
      setActivePort(null);
    }
  }, [activePort]);

  const handleLocalStart = async () => {
    if (!localFile && !text.trim()) {
      setSubmitError("Add a file or a message to start local sharing.");
      return;
    }
    if (localPort && (localPort < 1024 || localPort > 65535)) {
      setSubmitError("Port must be between 1024 and 65535.");
      return;
    }

    if (portAvailable === false) {
      setSubmitError("That port is already in use. Choose another.");
      return;
    }

    const form = new FormData();
    if (localFile) {
      form.append("file", localFile);
    }

    if (!localFile && text.trim()) {
      const key = pwEnabled && password ? password : "vaultdrop-anon";
      const encrypted = CryptoJS.AES.encrypt(text, key).toString();
      form.append("encryptedText", encrypted);
    }

    form.append("port", localPort);
    if (pwEnabled && password) form.append("password", password);
    if (dlEnabled && maxDownloads) form.append("maxDownloads", maxDownloads);
    if (autoClearEnabled && autoClearSeconds) form.append("autoClearSeconds", autoClearSeconds);

    const response = await uploadWithRetry(`${API_BASE}/local-server/start`, form);

    setShareKey(response.accessKey);
    setLocalIp(response.localIP || localIp);
    setActivePort(response.port);
    setIsSharing(true);
    setDownloadCount(0);
    setDownloadLimitReached(false);

    const minutes = parseInt(expireMinutes, 10) || 30;
    const endTime = Date.now() + minutes * 60 * 1000;
    setSessionEndTime(endTime);
    setTimeRemaining(minutes * 60 * 1000);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitError("");
    setPhase("loading");
    setProgress(0);

    const schedule = [
      { at: 0, msg: "Encrypting your data…" },
      { at: 1200, msg: "Sealing the vault…" },
      { at: 2500, msg: "Generating access codes…" },
      { at: 4000, msg: "Almost ready…" },
    ];

    const timers = schedule.map(({ at, msg }) => setTimeout(() => setLoadMsg(msg), at));

    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue = Math.min(progressValue + Math.random() * 8 + 2, 92);
      setProgress(progressValue);
    }, 200);

    try {
      if (mode === "local") {
        await handleLocalStart();
        clearInterval(interval);
        timers.forEach(clearTimeout);
        setPhase("idle");
        setProgress(0);
        return;
      }

      const form = new FormData();
      form.append("expireSeconds", expiry);
      if (pwEnabled && password) form.append("password", password);
      if (dlEnabled && maxDownloads) form.append("maxDownloads", maxDownloads);

      if (mode === "file") {
        form.append("file", file);
        form.append("isText", "false");
      } else if (mode === "text") {
        const key = pwEnabled && password ? password : "vaultdrop-anon";
        const encrypted = CryptoJS.AES.encrypt(text, key).toString();
        form.append("encryptedText", encrypted);
        form.append("isText", "true");
        form.append("burnAfterRead", String(burnAfterRead));
      }

      const data = await uploadWithRetry(`${API_BASE}/upload`, form);

      clearInterval(interval);
      timers.forEach(clearTimeout);
      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 350));
      router.push(`/session/${data.ownerToken}`);
    } catch (err) {
      clearInterval(interval);
      timers.forEach(clearTimeout);
      setPhase("error");
      setProgress(0);
      setSubmitError(err?.message || "Upload failed. Please try again.");
    }
  };

  const copyLink = () => {
    if (!shareKey) return;
    const link = `http://${localIp}:5173/access/qr?key=${encodeURIComponent(shareKey)}`;
    navigator.clipboard.writeText(link).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (phase === "loading") {
    return (
      <div className="upload-screen" role="status" aria-live="polite">
        <div className="upload-spinner-wrap">
          <div className="upload-spinner-ring" />
          <Lock className="upload-lock-icon" size={26} />
        </div>
        <p className="upload-headline">Creating your vault…</p>
        <p className="upload-sub mono">{loadMsg}</p>
        <div
          className="upload-bar-track"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="upload-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="upload-pct mono">{Math.round(progress)}%</p>
      </div>
    );
  }

  return (
    <main className="share-page">
      <header className="page-head">
        <h1>New Drop</h1>
        <p>Share anything. It vanishes on your schedule.</p>
      </header>

      <div className="mode-tabs" role="tablist">
        {[
          ["file", "File Upload"],
          ["text", "Secret Text"],
          ["local", "Local Network"],
        ].map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={mode === value}
            className={`mode-tab ${mode === value ? "active" : ""}`}
            onClick={() => {
              setMode(value);
              setSubmitError("");
              setFileError("");
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {(submitError || fileError) && (
        <div className="error-banner" role="alert">
          <AlertCircle size={14} />
          <span>{submitError || fileError}</span>
          <button onClick={() => {
            setSubmitError("");
            setFileError("");
          }} aria-label="Dismiss error">
            <X size={12} />
          </button>
        </div>
      )}

      {mode === "file" && (
        <div className="input-card">
          <input
            ref={fileRef}
            type="file"
            hidden
            onChange={(event) => setFileSafe(event.target.files?.[0])}
          />
          {file ? (
            <div className="file-selected">
              <div className="file-icon-wrap">
                <FileText size={18} />
              </div>
              <div className="file-meta">
                <span className="file-name" title={file.name}>{file.name}</span>
                <span className="file-size mono">{formatBytes(file.size)}</span>
              </div>
              <button
                className="file-remove"
                onClick={() => {
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                aria-label="Remove file"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div
              className={`drop-zone ${dragging ? "dragging" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter") fileRef.current?.click();
              }}
            >
              <Upload size={34} className={`dz-icon ${dragging ? "active" : ""}`} />
              <p className="dz-primary">{dragging ? "Drop it here" : "Drag & drop your file"}</p>
              <p className="dz-secondary">or click to browse · max 4 MB</p>
            </div>
          )}
        </div>
      )}

      {mode === "text" && (
        <div className="input-card">
          <div className="textarea-header">
            <label htmlFor="secret-text">Secret Message</label>
            <span className="char-count mono">{text.length} / 5000</span>
          </div>
          <textarea
            id="secret-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={5000}
            placeholder="Type a password, API key, private note, or anything sensitive…"
            className="secret-textarea mono"
          />
          <div className="burn-option">
            <Flame size={14} className="burn-flame" />
            <div className="burn-labels">
              <span>Burn After Read</span>
              <span className="setting-desc">Self-destructs immediately after first view</span>
            </div>
            <button
              className={`toggle ${burnAfterRead ? "on" : "off"}`}
              onClick={() => setBurnAfterRead((value) => !value)}
              aria-pressed={burnAfterRead}
            />
          </div>
        </div>
      )}

      {mode === "local" && (
        <div className="input-card">
          <div className="local-header">
            <Wifi size={36} className="local-wifi-icon" />
            <h3>Local Network Share</h3>
            <p>Share directly to devices on your WiFi or LAN. Nothing leaves your network.</p>
          </div>

          <div className="local-ip-row">
            <span>Your local IP</span>
            <span className="mono local-ip">{localIp}</span>
          </div>

          <div className="local-fields">
            <div className="local-field">
              <label htmlFor="local-port">Port</label>
              <input
                id="local-port"
                type="number"
                value={localPort}
                min="1024"
                max="65535"
                onChange={(event) => setLocalPort(event.target.value)}
              />
            </div>
            <div className="local-field local-field-wide">
              <label>File (optional)</label>
              <input
                type="text"
                readOnly
                placeholder="No file selected — or pick one"
                value={localFile?.name || ""}
                onClick={() => localFileRef.current?.click()}
              />
              <input
                ref={localFileRef}
                type="file"
                hidden
                onChange={(event) => setLocalFile(event.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="textarea-header" style={{ marginTop: "16px" }}>
            <label htmlFor="local-message">Or share a message</label>
            <span className="char-count mono">{text.length} / 5000</span>
          </div>
          <textarea
            id="local-message"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={5000}
            placeholder="Type a short message if you prefer not to send a file…"
            className="secret-textarea mono"
          />

          {portAvailable === false && (
            <p className="inline-error" role="alert">
              <AlertCircle size={13} /> Port already in use
            </p>
          )}
        </div>
      )}

      <div className="settings-card">
        <p className="settings-title">Drop Settings</p>

        {mode !== "local" && (
          <div className="setting-field">
            <label htmlFor="expiry-select">Expires in</label>
            <select id="expiry-select" value={expiry} onChange={(event) => setExpiry(event.target.value)}>
              <option value="3600">1 hour</option>
              <option value="86400">24 hours</option>
              <option value="259200">3 days</option>
              <option value="604800">7 days</option>
              <option value="2592000">30 days</option>
            </select>
          </div>
        )}

        {mode === "local" && (
          <div className="setting-field">
            <label htmlFor="local-expiry">Session duration</label>
            <select id="local-expiry" value={expireMinutes} onChange={(event) => setExpireMinutes(event.target.value)}>
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
        )}

        {mode === "local" && (
          <div className="setting-toggle-row">
            <div className="setting-meta">
              <Clock size={13} />
              <div>
                <span className="setting-label">Auto-clear message</span>
                <span className="setting-desc">Delete message from viewer after a timer</span>
              </div>
            </div>
            <button
              className={`toggle ${autoClearEnabled ? "on" : "off"}`}
              onClick={() => setAutoClearEnabled((value) => !value)}
              aria-pressed={autoClearEnabled}
              type="button"
            />
          </div>
        )}

        {mode === "local" && autoClearEnabled && (
          <div className="setting-field">
            <label htmlFor="auto-clear-select">Auto-clear after</label>
            <select
              id="auto-clear-select"
              value={autoClearSeconds}
              onChange={(event) => setAutoClearSeconds(event.target.value)}
            >
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="300">5 minutes</option>
              <option value="600">10 minutes</option>
            </select>
          </div>
        )}

        <hr />

        <div className="setting-toggle-row">
          <div className="setting-meta">
            <Lock size={13} />
            <div>
              <span className="setting-label">Password Protection</span>
              <span className="setting-desc">Require a passphrase to access</span>
            </div>
          </div>
          <button
            className={`toggle ${pwEnabled ? "on" : "off"}`}
            onClick={() => setPwEnabled((value) => !value)}
            aria-pressed={pwEnabled}
          />
        </div>
        {pwEnabled && (
          <div className="pw-field">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Enter a secure passphrase"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
            <button
              className="pw-eye"
              onClick={() => setShowPw((value) => !value)}
              aria-label={showPw ? "Hide password" : "Show password"}
              type="button"
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        )}

        <hr />

        <div className="setting-toggle-row">
          <div className="setting-meta">
            <Download size={13} />
            <div>
              <span className="setting-label">Download Limit</span>
              <span className="setting-desc">Auto-destroy after N downloads</span>
            </div>
          </div>
          <button
            className={`toggle ${dlEnabled ? "on" : "off"}`}
            onClick={() => setDlEnabled((value) => !value)}
            aria-pressed={dlEnabled}
          />
        </div>
        {dlEnabled && (
          <input
            type="number"
            min="1"
            max="100"
            value={maxDownloads}
            onChange={(event) => setMaxDownloads(event.target.value)}
            aria-label="Maximum downloads"
            placeholder="e.g. 5"
          />
        )}
      </div>

      <div className="summary-tags" aria-label="Drop configuration summary">
        {mode !== "local" && (
          <span className="tag">
            <Clock size={10} /> {expiryLabels[expiry] || "Custom"}
          </span>
        )}
        {pwEnabled && password && (
          <span className="tag">
            <Lock size={10} /> Password protected
          </span>
        )}
        {dlEnabled && maxDownloads && <span className="tag">↓ {maxDownloads} limit</span>}
        {burnAfterRead && mode === "text" && (
          <span className="tag danger">
            <Flame size={10} /> Burn after read
          </span>
        )}
      </div>

      <button
        className="submit-btn"
        onClick={handleSubmit}
        disabled={!canSubmit}
        aria-disabled={!canSubmit}
      >
        {mode === "local" ? (isSharing ? "Sharing Live" : "Start Local Sharing →") : "Generate Drop Link →"}
      </button>

      {mode === "local" && isSharing && shareKey && (
        <div className="input-card">
          <h3>Share Access Link</h3>
          <p>Send this link to people on your local network to give them access.</p>

          <div className="download-stats">
            <div className="stat-item">
              <Clock size={16} />
              <span className="stat-label">Time Remaining:</span>
              <span className="stat-value mono">
                {timeRemaining ? `${Math.floor(timeRemaining / 60000)}:${Math.floor((timeRemaining % 60000) / 1000).toString().padStart(2, "0")}` : "00:00"}
              </span>
            </div>
            <div className="stat-item">
              <Download size={16} />
              <span className="stat-label">Downloads:</span>
              <span className="stat-value mono">
                {downloadCount}
                {dlEnabled && maxDownloads ? ` / ${maxDownloads}` : ""}
              </span>
            </div>
            {downloadLimitReached && (
              <div className="limit-reached-notice">
                <Check size={14} /> Download limit reached! Server will stop automatically.
              </div>
            )}
          </div>

          <div className="key-box">
            <input
              type="text"
              readOnly
              value={`http://${localIp}:5173/access/qr?key=${encodeURIComponent(shareKey)}`}
            />
            <button onClick={copyLink} className={`copy-btn ${isCopied ? "copied" : ""}`}>
              {isCopied ? "Copied!" : "Copy Link"}
            </button>
          </div>

          <div className="qr-code-section">
            <h4>Or Scan QR Code</h4>
            <p className="qr-description">Recipients can scan this to instantly connect</p>
            <div className="qr-code-wrapper">
              <QRCodeSVG
                value={`http://${localIp}:5173/access/qr?key=${encodeURIComponent(shareKey)}`}
                size={200}
                level="H"
                includeMargin
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            <p className="qr-note">Scan to auto-connect · Recipient must be on same network</p>
          </div>

          <div className="session-actions">
            <button className="btn-danger" onClick={handleStopSharing}>
              Stop Sharing
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
