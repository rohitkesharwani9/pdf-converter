// API utility for handling backend URLs
const getApiUrl = (endpoint: string): string => {
  // In production, use relative URLs (they'll be proxied)
  // In development, use the environment variable or fallback to localhost
  if ((import.meta as any).env?.PROD) {
    return endpoint;
  }
  
  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001';
  return `${apiUrl}${endpoint}`;
};

export default getApiUrl; 