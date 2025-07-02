// API utility for handling backend URLs
const getApiUrl = (endpoint: string): string => {
  // In production (Coolify), use the backend service name
  // In development, use the environment variable or fallback to localhost
  if ((import.meta as any).env?.PROD) {
    // In production, use relative URLs which will be proxied to the backend
    return endpoint;
  }
  
  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001';
  return `${apiUrl}${endpoint}`;
};

export default getApiUrl; 