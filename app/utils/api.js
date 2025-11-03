import { API_BASE } from '../config';

export const uploadAnonFile = async (file, expireSeconds = 3600, password = '', maxDownloads = null, encryptedText = null) => {
  const form = new FormData();
  if (file) {
    form.append('file', file); // correct field name
  }
  if (encryptedText) {
    form.append('encryptedText', encryptedText);
  }
  form.append('expireSeconds', expireSeconds);
  if (password) form.append('password', password);
  if (maxDownloads) form.append('maxDownloads', maxDownloads);

  console.log('[Upload] Sending request to:', `${API_BASE}/upload`);
  console.log('[Upload] API_BASE:', API_BASE);
  console.log('[Upload] Form data:', {
    hasFile: !!file,
    hasEncryptedText: !!encryptedText,
    expireSeconds,
    hasPassword: !!password,
    maxDownloads
  });

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: form,
  });

  console.log('[Upload] Response status:', res.status);
  console.log('[Upload] Response headers:', Object.fromEntries(res.headers.entries()));

  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    let errorMessage = 'Upload failed';
    
    console.log('[Upload] Error response content-type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const errorData = await res.json();
      console.log('[Upload] Error data:', errorData);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } else {
      const text = await res.text();
      console.log('[Upload] Error text:', text.substring(0, 500)); // Log first 500 chars
      errorMessage = text || `Server returned ${res.status}`;
    }
    
    throw new Error(errorMessage);
  }

  return res.json();
};

export const checkSessionStatus = async (sessionId) => {
  try{
    const res = await fetch(`${API_BASE}/check-session/${sessionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error('HTTP error: ' + res.status);
    }
    return res.json();
  }catch(error) {
    console.error('Error checking session status:', error);
    throw error;
  }
};

export const fetchSessionInfo = async (sessionId, password = '') => {
  const query = password ? `?password=${encodeURIComponent(password)}` : '';
  const res = await fetch(`${API_BASE}/session-info/${sessionId}${query}`);
  if (!res.ok) throw new Error('Session not found');
  return res.json(); // returns metadata
};

export const downloadFile = async (sessionId, password = '') => {
  try {
    const query = password ? `?password=${encodeURIComponent(password)}` : '';
    const downloadUrl = `${API_BASE}/download/${sessionId}${query}`;
    
    // Fetch the file as blob
    const response = await fetch(downloadUrl, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Download failed');
    }
    
    // Get filename from Content-Disposition header if available
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'download';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    // Fallback to direct navigation if fetch fails
    const query = password ? `?password=${encodeURIComponent(password)}` : '';
    window.location.href = `${API_BASE}/download/${sessionId}${query}`;
  }
};


export const uploadLocFile = async (file, expireSeconds = 1800, password = '', maxDownloads = null) => {
  const form = new FormData();
  form.append('file', file);
  form.append('expireSeconds', expireSeconds);
  if (password) form.append('password', password);
  if (maxDownloads) form.append('maxDownloads', maxDownloads);

  const res = await fetch(`${API_BASE}/locshare/upload`, {
    method: 'POST',
    body: form,
  });

  return res.json();
};

export const endSharingSession = async (ownerToken) => {
  const res = await fetch(`${API_BASE}/endsession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerToken }),
  });

  return res.json();
};

export const fetchSessionData = async (ownerToken) => {
  const res = await fetch(`${API_BASE}/session-data/${ownerToken}`);
  if (!res.ok) throw new Error('Session not found or unauthorized');
  return res.json();
};

export const startLocalServer = async (file, port, password = null, maxDownloads = null, encryptedText = null) => {
  const form = new FormData();
  if (file) {
    form.append('file', file);
  }
  if (encryptedText) {
    form.append('encryptedText', encryptedText);
  }
  form.append('port', port);
  if (password) form.append('password', password);
  if (maxDownloads) form.append('maxDownloads', maxDownloads);

  const res = await fetch(`${API_BASE}/local-server/start`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to start local server');
  }

  return res.json();
};

export const stopLocalServer = async (port) => {
  const res = await fetch(`${API_BASE}/local-server/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ port }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to stop local server');
  }

  return res.json();
};

export const checkPort = async (port) => {
  const res = await fetch(`${API_BASE}/local-server/check-port/${port}`);
  return res.json();
};

export const getServerStats = async (port) => {
  const res = await fetch(`${API_BASE}/local-server/stats/${port}`);
  if (!res.ok) {
    throw new Error('Failed to get server stats');
  }
  return res.json();
};

export const fetchLocFileInfo = async (host, port, password = null) => {
  const query = password ? `?password=${encodeURIComponent(password)}` : '';
  const res = await fetch(`http://${host}:${port}/info${query}`);
  if (!res.ok) throw new Error('Failed to fetch file info');
  return res.json();
};