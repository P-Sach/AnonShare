"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BarChart3, Check, Clock, Copy, Download, Shield } from "lucide-react";
import { API_BASE } from "../../config";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatCountdown(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function SessionPage() {
  const { ownerToken } = useParams();
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);
  const [newDownload, setNewDownload] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const prevDownloads = useRef(0);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/session-data/${ownerToken}`);
      if (res.status === 404) {
        router.replace("/expired?reason=not-found");
        return;
      }
      if (!res.ok) return;

      const data = await res.json();
      setSession(data);
      setLoading(false);

      if (prevDownloads.current > 0 && data.downloads > prevDownloads.current) {
        setNewDownload(true);
        setTimeout(() => setNewDownload(false), 3500);
      }
      prevDownloads.current = data.downloads;

      const remaining = Math.max(0, Math.floor((new Date(data.expiresAt) - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) router.replace("/expired?reason=time");
    } catch {
      // Ignore polling errors.
    }
  }, [ownerToken, router]);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 5000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.replace("/expired?reason=time");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/download/${session?.accessCode}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleCancel = async () => {
    const confirmed = window.confirm(
      "End this session?\n\nThe file will be permanently deleted and the share link will stop working immediately."
    );
    if (!confirmed) return;

    setCancelling(true);
    try {
      await fetch(`${API_BASE}/endsession`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerToken }),
      });
      router.replace("/expired?reason=cancelled");
    } catch {
      setCancelling(false);
      alert("Could not cancel session — please try again.");
    }
  };

  if (loading) {
    return (
      <div className="page-loading" role="status">
        <div className="loading-spinner" />
        <p>Loading your session…</p>
      </div>
    );
  }

  if (!session) return null;

  const downloadPercent = session.maxDownloads
    ? Math.min((session.downloads / session.maxDownloads) * 100, 100)
    : null;
  const limitReached = session.maxDownloads && session.downloads >= session.maxDownloads;

  return (
    <main className="session-page">
      <div className="session-header">
        <div>
          <div className={`status-badge ${limitReached ? "limit-reached" : "active"}`}>
            <span className="status-dot" />
            {limitReached ? "Download limit reached" : "Drop Active"}
          </div>
          <h1>Your Drop is Live</h1>
        </div>
        <div className="countdown-block" aria-label="Time remaining">
          <span className="countdown-time mono">{formatCountdown(countdown)}</span>
          <span className="countdown-label">time remaining</span>
        </div>
      </div>

      {newDownload && (
        <div className="dl-toast" role="status" aria-live="polite">
          <Download size={13} />
          Someone just downloaded your file!
        </div>
      )}

      <div className="card link-card">
        <p className="card-label">Share Link</p>
        <div className="link-row">
          <code className="share-url" aria-label="Share URL">{shareUrl}</code>
          <button
            className={`copy-btn ${copied ? "copied" : ""}`}
            onClick={handleCopy}
            aria-label={copied ? "Link copied" : "Copy link"}
          >
            {copied ? (
              <>
                <Check size={12} /> Copied!
              </>
            ) : (
              <>
                <Copy size={12} /> Copy
              </>
            )}
          </button>
        </div>
      </div>

      <div className="stats-qr-grid">
        <div className="card stats-card">
          <p className="card-label">Session Info</p>

          <div className="stat-list">
            {[
              ["Filename", session.name, false],
              ["Size", formatBytes(session.totalSize), true],
              ["Type", session.isText ? "Encrypted text" : (session.mimeType || "Unknown"), false],
              ["Password", session.passwordProtected ? "Protected" : "None", false],
              ["Expiry", session.expiryLabel || "24 hours", false],
            ].map(([label, value, mono]) => (
              <div key={label} className="stat-row">
                <span className="stat-label">{label}</span>
                <span className={`stat-value ${mono ? "mono" : ""}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="dl-counter">
            <div className="dl-counter-row">
              <span>
                <BarChart3 size={12} /> Downloads
              </span>
              <span className="mono">
                {session.downloads}
                {session.maxDownloads ? ` / ${session.maxDownloads}` : " (unlimited)"}
              </span>
            </div>
            {downloadPercent !== null && (
              <div
                className="dl-track"
                role="progressbar"
                aria-valuenow={session.downloads}
                aria-valuemax={session.maxDownloads}
              >
                <div
                  className="dl-fill"
                  style={{
                    width: `${downloadPercent}%`,
                    backgroundColor: limitReached ? "var(--red)" : "var(--acid)",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="card qr-card">
          <p className="card-label">Scan to Share</p>
          {session.qrCode ? (
            <img
              src={session.qrCode}
              alt={`QR code for share URL: ${shareUrl}`}
              className="qr-img"
            />
          ) : (
            <div className="qr-placeholder" aria-label="QR code loading">
              Generating QR…
            </div>
          )}
          <p className="qr-hint">Recipients can scan to download instantly</p>
        </div>
      </div>

      <div className="session-actions">
        <button className="btn-ghost" onClick={() => router.push(`/download/${session.accessCode}`)}>
          Preview recipient view →
        </button>
        <button className="btn-danger" onClick={handleCancel} disabled={cancelling} aria-disabled={cancelling}>
          {cancelling ? "Ending session…" : "End Session"}
        </button>
      </div>

      <p className="security-note">
        <Shield size={11} />
        Files are stored securely and deleted on expiry or cancellation.
        {session.burnAfterRead ? " This message will self-destruct after first view." : ""}
      </p>
    </main>
  );
}
