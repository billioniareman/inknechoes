import axiosClient from './axiosClient'

export interface User {
  id: number
  email: string
  username: string
  bio?: string
  genre_tags?: string
  is_active: boolean
  is_admin: boolean
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
}

