const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const getConversations = () => request('/api/conversations');
export const getMessages = (waId) => request(`/api/messages/${encodeURIComponent(waId)}`);
export const sendMessage = (to, text) => request('/api/messages', {
  method: 'POST', body: JSON.stringify({ to, text })
});
export { API_BASE };
