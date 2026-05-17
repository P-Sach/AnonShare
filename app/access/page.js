"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Download, Lock, Server, Shield } from "lucide-react";

export default function AccessPage() {
  const router = useRouter();

  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState("");

  const [accessKey, setAccessKey] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [files, setFiles] = useState([]);
  const [hasLocShareKey, setHasLocShareKey] = useState(false);
  const sessionCheckRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const qrKey = sessionStorage.getItem("locshare-access-key");
    if (qrKey) {
      setAccessKey(qrKey);
      setHasLocShareKey(true);
      sessionStorage.removeItem("locshare-access-key");
      setTimeout(() => {
        handleVerifyKey({ preventDefault: () => {} }, qrKey);
      }, 300);
    }
  }, []);

  useEffect(() => {
    if (!isConnected || !connectionInfo) return;

    const checkServerStatus = async () => {
      try {
        const response = await fetch(`http://${connectionInfo.host}:${connectionInfo.port}/ping`);
        if (!response.ok) throw new Error("Server not responding");
      } catch {
        setError("The sharing session has ended. The server is no longer available.");
        setIsConnected(false);
        setFiles([]);
        clearInterval(sessionCheckRef.current);
      }
    };

    sessionCheckRef.current = setInterval(checkServerStatus, 3000);

    return () => {
      if (sessionCheckRef.current) clearInterval(sessionCheckRef.current);
    };
  }, [isConnected, connectionInfo]);

  const handleAnonShareSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!urlInput.trim()) {
      setError("Please enter a URL or access code");
      return;
    }

    try {
      if (urlInput.includes("http://") || urlInput.includes("https://") || urlInput.includes("/download/")) {
        let accessCode = "";

        if (urlInput.includes("/download/")) {
          const parts = urlInput.split("/download/");
          accessCode = parts[1]?.split("?")[0]?.split("/")[0] || "";
        } else {
          const url = new URL(urlInput.startsWith("http") ? urlInput : `https://${urlInput}`);
          const pathParts = url.pathname.split("/").filter(Boolean);
          accessCode = pathParts[pathParts.length - 1] || "";
        }

        if (accessCode) {
          router.push(`/download/${accessCode}`);
        } else {
          setError("Could not extract access code from URL");
        }
      } else {
        router.push(`/download/${urlInput.trim()}`);
      }
    } catch {
      router.push(`/download/${urlInput.trim()}`);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrlInput(text);
      setError("");
    } catch {
      setError("Failed to read from clipboard. Please paste manually.");
    }
  };

  const handleVerifyKey = useCallback(async (event, keyOverride = null) => {
    event.preventDefault();
    setError("");

    const keyToUse = keyOverride || accessKey;
    if (!keyToUse) {
      setError("Access key is missing");
      return;
    }

    setIsVerifying(true);

    try {
      const decoded = atob(keyToUse);
      const keyData = JSON.parse(decoded);

      const host = keyData.host;
      const isLocalIP = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.0\.0\.1|localhost)/.test(host);
      if (!isLocalIP) {
        setIsVerifying(false);
        setError("Access denied: This share is only available on the local network");
        return;
      }

      setHasLocShareKey(true);

      const connInfo = {
        host: keyData.host,
        port: keyData.port,
        fileName: keyData.fileName,
        requiredPassword: keyData.password,
        autoClearSeconds: keyData.autoClearSeconds || null,
      };

      setConnectionInfo(connInfo);
      setIsVerifying(false);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("locshare-host", keyData.host || "");
        sessionStorage.setItem("locshare-port", String(keyData.port || ""));
        sessionStorage.setItem(
          "locshare-auto-clear",
          keyData.autoClearSeconds ? String(keyData.autoClearSeconds) : ""
        );
      }

      if (!keyData.password) {
        await fetchLocFileInfo(keyData.host, keyData.port, null);
      }
    } catch {
      setIsVerifying(false);
      setError("Invalid access key format");
    }
  }, [accessKey]);

  const fetchLocFileInfo = async (host, port, pwd = null) => {
    try {
      const response = await fetch(`http://${host}:${port}/info${pwd ? `?password=${encodeURIComponent(pwd)}` : ""}`);
      if (!response.ok) throw new Error("Failed to connect to local server");

      const fileInfo = await response.json();
      if (fileInfo.downloadLimitReached) {
        setError("Download limit has been reached for this file.");
        return;
      }

      const list = [{
        id: 1,
        name: fileInfo.name,
        size: `${(fileInfo.size / 1024 / 1024).toFixed(2)} MB`,
        type: fileInfo.type,
        passwordProtected: fileInfo.passwordProtected,
        downloadCount: fileInfo.downloadCount || 0,
        maxDownloads: fileInfo.maxDownloads,
        isText: fileInfo.isText || false,
      }];

      setFiles(list);
      setIsConnected(true);
    } catch {
      setError("Failed to connect to local server. Make sure the sender is online.");
    }
  };

  const handleConnect = async (event) => {
    if (event) event.preventDefault();

    if (connectionInfo?.requiredPassword && connectionInfo.requiredPassword !== password) {
      setError("Incorrect password");
      return;
    }

    setIsVerifying(true);
    await fetchLocFileInfo(connectionInfo.host, connectionInfo.port, password);
    setIsVerifying(false);
  };

  const handleDownload = async (fileId) => {
    const file = files.find((item) => item.id === fileId);
    if (!file) return;

    if (file.isText) {
      try {
        const response = await fetch(
          `http://${connectionInfo.host}:${connectionInfo.port}/download?password=${encodeURIComponent(password || "")}`
        );
        if (!response.ok) {
          const err = await response.json();
          setError(err.error || "Failed to fetch message");
          return;
        }
        const data = await response.json();
        sessionStorage.setItem("encrypted-text", data.encryptedText);
        sessionStorage.setItem("text-has-password", password ? "true" : "false");
        sessionStorage.setItem("text-password", password || "");
        sessionStorage.setItem("locshare-opened-at", String(Date.now()));
        router.push("/text-viewer");
      } catch {
        setError("Failed to fetch message");
      }
    } else {
      const downloadUrl = `http://${connectionInfo.host}:${connectionInfo.port}/download?password=${encodeURIComponent(password || "")}`;
      window.location.href = downloadUrl;
    }
  };

  return (
    <main className="download-page">
      <div className="download-card card">
        <div className="file-display">
          <div className="file-emoji" role="img" aria-label="Access">🔓</div>
          <h2 className="file-name">Receive a Drop</h2>
          <p className="file-size mono">Enter a VaultDrop link or access code.</p>
        </div>

        <form onSubmit={handleAnonShareSubmit} className="password-section">
          <div className="pw-field">
            <input
              type="text"
              placeholder="Paste download link or access code"
              value={urlInput}
              onChange={(event) => {
                setUrlInput(event.target.value);
                setError("");
              }}
            />
          </div>
          <div className="session-actions">
            <button type="button" className="btn-ghost" onClick={handlePasteFromClipboard}>
              Paste
            </button>
            <button type="submit" className="btn-primary">
              Open Drop
            </button>
          </div>
        </form>

        {error && (
          <p className="pw-error">
            <AlertCircle size={11} /> {error}
          </p>
        )}
      </div>

      <div className="download-card card">
        <div className="file-display">
          <div className="file-emoji" role="img" aria-label="Local">📶</div>
          <h2 className="file-name">Local Network Drop</h2>
          <p className="file-size mono">Open a QR link from someone on your WiFi.</p>
        </div>

        {!hasLocShareKey && (
          <div className="pw-gate-label">
            <Shield size={13} />
            <span>Scan the QR code or open a local share link to connect.</span>
          </div>
        )}

        {!isConnected && connectionInfo && connectionInfo.requiredPassword && (
          <form onSubmit={handleConnect} className="password-section">
            <div className="pw-gate-label">
              <Server size={13} />
              <span>Connecting to {connectionInfo.host}:{connectionInfo.port}</span>
            </div>
            <div className="pw-field">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter the password for this share"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={isVerifying}>
              {isVerifying ? "Connecting…" : "Connect"}
            </button>
          </form>
        )}

        {isConnected && (
          <div className="download-section">
            <div className="unlocked-notice">
              <Check size={13} /> Connected to local share
            </div>
            {files.map((file) => (
              <div key={file.id} className="dl-limit-notice">
                <span>{file.name}</span>
                <button className="btn-primary" onClick={() => handleDownload(file.id)}>
                  {file.isText ? "View Message" : "Download"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
