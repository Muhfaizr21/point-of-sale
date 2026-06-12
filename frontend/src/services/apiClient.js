const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export const apiClient = {
  async request(method, endpoint, data = null) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const options = {
      method,
      headers,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

      // Handle raw error statuses
      if (!response.ok) {
        let errorMessage = 'Request failed';
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.message || errorMessage;
        } catch {
          // If response body is not JSON or empty
          errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // If empty success response (like DELETE often does)
      if (response.status === 204) {
        return null;
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`API Client Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  },

  get: (endpoint) => apiClient.request('GET', endpoint),
  post: (endpoint, data) => apiClient.request('POST', endpoint, data),
  put: (endpoint, data) => apiClient.request('PUT', endpoint, data),
  delete: (endpoint) => apiClient.request('DELETE', endpoint),
};
