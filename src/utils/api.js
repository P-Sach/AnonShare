import { API_BASE } from '../config';

export const uploadAnonFile = async (file, expireSeconds = 3600, password = '', maxDownloads = null) => {
  const form = new FormData();
  form.append('file', file); // correct field name
  form.append('expireSeconds', expireSeconds);
  if (password) form.append('password', password);
  if (maxDownloads) form.append('maxDownloads', maxDownloads);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: form,
  });

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

export const fetchSessionInfo = async (sessionId) => {
  const res = await fetch(`${API_BASE}/session-info/${sessionId}`);
  if (!res.ok) throw new Error('Session not found');
  return res.json(); // returns metadata
};

export const downloadFile = (sessionId, password = '') => {
  const query = password ? `?password=${encodeURIComponent(password)}` : '';
  window.location.href = `${API_BASE}/download/${sessionId}${query}`;
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

export const endSharingSession = async (sessionId) => {
  const res = await fetch(`${API_BASE}/endsession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });

  return res.json();
};