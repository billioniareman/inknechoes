import axios from 'axios'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  withCredentials: true,  // Keep this for cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add Authorization header if token exists
axiosClient.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage (if stored there)
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for token refresh
axiosClient.interceptors.response.use(
  (response) => {
    // Store token in localStorage if received in response
    if (response.data?.access_token) {
      localStorage.setItem('access_token', response.data.access_token)
    }
    return response
  },
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
        
        // If refresh successful, store token and retry the original request
        if (refreshResponse.status === 200 && refreshResponse.data?.access_token) {
          localStorage.setItem('access_token', refreshResponse.data.access_token)
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`
          return axiosClient(originalRequest)
        }
      } catch (refreshError: any) {
        // Refresh failed - clear retry flag and reject silently
        originalRequest._retry = false
        localStorage.removeItem('access_token')
        
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


