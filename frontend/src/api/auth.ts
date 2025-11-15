import axiosClient from './axiosClient'

export interface RegisterData {
  email: string
  username: string
  password: string
  bio?: string
  genre_tags?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface User {
  id: number
  email: string
  username: string
  bio?: string
  genre_tags?: string
  is_active: boolean
  is_admin: boolean
  email_verified: boolean
  created_at: string
}

export const authApi = {
  register: async (data: RegisterData) => {
    const response = await axiosClient.post('/api/v1/auth/register', data)
    return response.data
  },

  login: async (data: LoginData) => {
    const response = await axiosClient.post('/api/v1/auth/login', data)
    return response.data
  },

  logout: async () => {
    const response = await axiosClient.post('/api/v1/auth/logout')
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await axiosClient.get('/api/v1/auth/me')
    return response.data
  },

  requestPasswordReset: async (email: string) => {
    const response = await axiosClient.post('/api/v1/auth/password-reset', { email })
    return response.data
  },

  confirmPasswordReset: async (token: string, newPassword: string) => {
    const response = await axiosClient.post('/api/v1/auth/password-reset/confirm', {
      token,
      new_password: newPassword,
    })
    return response.data
  },

  verifyEmail: async (token: string) => {
    const response = await axiosClient.post('/api/v1/auth/verify-email', { token })
    return response.data
  },

  resendVerification: async (email: string) => {
    const response = await axiosClient.post('/api/v1/auth/resend-verification', { email })
    return response.data
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await axiosClient.post('/api/v1/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    return response.data
  },

  deleteAccount: async (password: string) => {
    const response = await axiosClient.delete('/api/v1/auth/account', {
      data: { password },
    })
    return response.data
  },
}

