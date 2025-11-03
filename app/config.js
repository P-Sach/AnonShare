// Remove trailing slash from API_BASE to prevent double slashes in URLs
const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
export const API_BASE = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
