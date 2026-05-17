"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import CryptoJS from "crypto-js";
import {
  AlertCircle,
  Check,
  Clock,
  Eye,
  EyeOff,
  Flame,
  Lock,
  Shield,
} from "lucide-react";
import { API_BASE } from "../../config";

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function humanExpiry(expiresAt) {
  const diff = Math.max(0, new Date(expiresAt) - Date.now());
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function DownloadPage() {
  const { accessCode } = useParams();

  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pwError, setPwError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);
  const [dlError, setDlError] = useState("");

  const [decryptedText, setDecryptedText] = useState("");
  const [textCopied, setTextCopied] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(`${API_BASE}/session-info/${accessCode}`);
        if (res.status === 404 || res.status === 410) {
          setExpired(true);
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Session not found");
        const data = await res.json();
        setInfo(data);
        if (!data.passwordProtected) setUnlocked(true);
      } catch {
        setExpired(true);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [accessCode]);

  useEffect(() => {
    if (!info || expired || cancelled) return;

    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/check-session/${accessCode}`);
        if (!active) return;
        if (res.status === 404 || res.status === 410) setCancelled(true);
      } catch {
        // Ignore polling errors.
      }
    };

    const interval = setInterval(poll, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [accessCode, info, expired, cancelled]);

  const handleUnlock = async () => {
    if (!password.trim()) return;
    setVerifying(true);
    setPwError("");

    try {
      const res = await fetch(
        `${API_BASE}/session-info/${accessCode}?password=${encodeURIComponent(password)}`
      );
      if (res.status === 401) {
        setPwError("Incorrect password. Please try again.");
        return;
      }
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setInfo(data);
      setUnlocked(true);
    } catch {
      setPwError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = async () => {
    if (!info) return;
    setDownloading(true);
    setDlError("");

    try {
      const url = `${API_BASE}/download/${accessCode}${password ? `?password=${encodeURIComponent(password)}` : ""}`;
      const res = await fetch(url);

      if (res.status === 403) {
        setDlError("Download limit reached — this drop has been used up.");
        return;
      }

      if (!res.ok) throw new Error("Download failed");

      if (info.isText) {
        const payload = await res.json();
        const key = password || "vaultdrop-anon";
        try {
          const bytes = CryptoJS.AES.decrypt(payload.encryptedText, key);
          const plain = bytes.toString(CryptoJS.enc.Utf8);
          if (!plain) throw new Error("Bad key");
          setDecryptedText(plain);
          setDone(true);
        } catch {
          setDlError("Could not decrypt the message. The password may be wrong.");
        }
      } else {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = info.name || "vaultdrop-file";
        a.click();
        URL.revokeObjectURL(blobUrl);
        setDone(true);
      }
    } catch {
      setDlError("Download failed. The link may have expired.");
    } finally {
      setDownloading(false);
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(decryptedText).catch(() => {});
    setTextCopied(true);
    setTimeout(() => setTextCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="page-loading" role="status">
        <div className="loading-spinner" />
        <p>Checking this drop…</p>
      </div>
    );
  }

  if (expired || cancelled) {
    return (
      <div className="expired-screen">
        <div className="expired-icon">⌛</div>
        <h2>{cancelled ? "This drop was cancelled" : "This drop has expired"}</h2>
        <p>
          {cancelled
            ? "The sender ended this sharing session."
            : "The file was automatically deleted when the timer ran out."}
        </p>
        <a href="/share" className="btn-primary">
          Create your own drop →
        </a>
      </div>
    );
  }

  if (!info) return null;

  return (
    <main className="download-page">
      {info.expiresAt && (
        <div className="expiry-banner">
          <Clock size={12} />
          <span>
            Expires in <strong>{humanExpiry(info.expiresAt)}</strong>
          </span>
        </div>
      )}

      <div className="download-card card">
        <div className="file-display">
          <div className="file-emoji" role="img" aria-label="File type icon">
            {info.isText ? "🔏" : "📁"}
          </div>
          <h2 className="file-name">{info.name || "Secure Message"}</h2>
          {info.size && (
            <p className="file-size mono">
              {formatBytes(info.size)} · {info.mimeType || "Encrypted"}
            </p>
          )}
          {info.burnAfterRead && (
            <div className="burn-notice">
              <Flame size={12} />
              <span>Burn after read — vanishes after you view it</span>
            </div>
          )}
        </div>

        {info.maxDownloads && (
          <div className="dl-limit-notice">
            <Shield size={11} />
            <span>
              {info.downloadCount ?? 0} of {info.maxDownloads} downloads used
            </span>
          </div>
        )}

        {!unlocked && (
          <div className="password-section">
            <div className="pw-gate-label">
              <Lock size={13} />
              <span>Password required to access this drop</span>
            </div>
            <div className="pw-field">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Enter password…"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setPwError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleUnlock();
                }}
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
            {pwError && (
              <p className="pw-error">
                <AlertCircle size={11} /> {pwError}
              </p>
            )}
            <button
              className="btn-primary unlock-btn"
              onClick={handleUnlock}
              disabled={verifying || !password.trim()}
            >
              {verifying ? "Verifying…" : "Unlock"}
            </button>
          </div>
        )}

        {unlocked && !done && (
          <div className="download-section">
            <div className="unlocked-notice">
              <Check size={13} />
              {info.passwordProtected ? "Password verified — ready to access" : "Ready to access"}
            </div>
            {dlError && (
              <p className="dl-error">
                <AlertCircle size={11} /> {dlError}
              </p>
            )}
            <button
              className="btn-primary download-btn"
              onClick={handleDownload}
              disabled={downloading}
              aria-disabled={downloading}
            >
              {downloading ? "Working…" : info.isText ? "View Secure Message" : "Download File"}
            </button>
          </div>
        )}

        {done && !info.isText && (
          <div className="done-section">
            <div className="done-check">
              <Check size={22} />
            </div>
            <p className="done-headline">Download complete</p>
            <p className="done-sub">The file has been saved to your device.</p>
          </div>
        )}

        {done && info.isText && decryptedText && (
          <div className="text-reveal">
            <div className="text-reveal-header">
              <span>Decrypted Message</span>
              <button onClick={copyText} className="copy-text-btn">
                {textCopied ? (
                  <>
                    <Check size={11} /> Copied
                  </>
                ) : (
                  "Copy"
                )}
              </button>
            </div>
            <pre className="revealed-text mono">{decryptedText}</pre>
            {info.burnAfterRead && (
              <p className="burned-notice">
                <Flame size={11} />
                This message has been permanently deleted from the server.
              </p>
            )}
          </div>
        )}
      </div>

      <p className="dl-footer">
        Shared via <Link href="/" className="brand-link">VaultDrop</Link> · {" "}
        <Link href="/share">Create your own secure drop</Link>
      </p>
    </main>
  );
}
