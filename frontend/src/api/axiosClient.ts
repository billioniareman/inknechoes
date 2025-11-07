import axios from 'axios'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for token refresh
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Skip refresh for auth endpoints (login, register, refresh itself, me)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                          originalRequest.url?.includes('/auth/register') ||
                          originalRequest.url?.includes('/auth/refresh') ||
                          originalRequest.url?.includes('/auth/me')

    // If 401 and not already retried, try to refresh token
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true

      try {
        // Attempt to refresh the token
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        )
        
        // If refresh successful, retry the original request
        if (refreshResponse.status === 200) {
          return axiosClient(originalRequest)
        }
      } catch (refreshError: any) {
        // Refresh failed - clear retry flag and reject silently
        originalRequest._retry = false
        
        // Don't log 401 errors from refresh endpoint (expected when not logged in)
        if (refreshError.response?.status !== 401) {
          console.error('Token refresh error:', refreshError)
        }
        
        return Promise.reject(refreshError)
      }
    }

    // Don't log 401 errors for auth endpoints (expected when not logged in)
    if (error.response?.status === 401 && isAuthEndpoint) {
      // Silently reject - this is expected behavior
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default axiosClient


