import axiosClient from './axiosClient'

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

export interface UserUpdate {
  bio?: string
  genre_tags?: string
}

export const usersApi = {
  getMyProfile: async (): Promise<User> => {
    const response = await axiosClient.get('/api/v1/users/me')
    return response.data
  },

  updateMyProfile: async (data: UserUpdate): Promise<User> => {
    const response = await axiosClient.put('/api/v1/users/me', data)
    return response.data
  },

  getUserProfile: async (username: string): Promise<User> => {
    const response = await axiosClient.get(`/api/v1/users/${username}`)
    return response.data
  },

  getUserPosts: async (username: string) => {
    const response = await axiosClient.get(`/api/v1/users/${username}/posts`)
    return response.data
  },

  getUserAnalytics: async (username: string) => {
    const response = await axiosClient.get(`/api/v1/users/${username}/analytics`)
    return response.data
  },

  getMyPreferences: async () => {
    const response = await axiosClient.get('/api/v1/users/me/preferences')
    return response.data
  },

  updateMyPreferences: async (data: UserPreferencesUpdate) => {
    const response = await axiosClient.put('/api/v1/users/me/preferences', data)
    return response.data
  },

  getMySessions: async (activeOnly: boolean = true) => {
    const response = await axiosClient.get('/api/v1/users/me/sessions', {
      params: { active_only: activeOnly },
    })
    return response.data
  },

  revokeSession: async (sessionId: number) => {
    const response = await axiosClient.delete(`/api/v1/users/me/sessions/${sessionId}`)
    return response.data
  },

  revokeAllSessions: async () => {
    const response = await axiosClient.post('/api/v1/users/me/sessions/revoke-all')
    return response.data
  },

  getMyAuditLogs: async (limit: number = 50, action?: string) => {
    const response = await axiosClient.get('/api/v1/users/me/audit-logs', {
      params: { limit, action },
    })
    return response.data
  },
}

export interface UserPreferencesUpdate {
  email_notifications_enabled?: boolean
  email_on_new_comment?: boolean
  email_on_new_follower?: boolean
  email_on_post_published?: boolean
  email_on_login?: boolean
  profile_visibility?: string
  show_email?: boolean
  show_analytics?: boolean
  default_content_type?: string
  default_visibility?: string
  ui_preferences?: Record<string, any>
}

export interface UserPreferences {
  email_notifications_enabled: boolean
  email_on_new_comment: boolean
  email_on_new_follower: boolean
  email_on_post_published: boolean
  email_on_login: boolean
  profile_visibility: string
  show_email: boolean
  show_analytics: boolean
  default_content_type: string
  default_visibility: string
  ui_preferences?: Record<string, any>
}

export interface UserSession {
  id: number
  ip_address?: string
  user_agent?: string
  device_info?: string
  location?: string
  is_active: boolean
  last_activity: string
  created_at: string
  expires_at: string
}

export interface AuditLog {
  id: number
  action: string
  status: string
  ip_address?: string
  user_agent?: string
  details?: string
  created_at: string
}

