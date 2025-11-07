import axiosClient from './axiosClient'

export interface AdminStats {
  total_users: number
  total_posts: number
  public_posts: number
  draft_posts: number
  total_comments: number
  total_likes: number
  total_claps: number
  recent_activity: {
    users_last_7_days: number
    posts_last_7_days: number
    comments_last_7_days: number
  }
  content_breakdown: {
    poetry: number
    book: number
    article: number
  }
  top_authors: Array<{
    username: string
    post_count: number
  }>
}

export interface User {
  id: number
  username: string
  email: string
  bio?: string
  is_active: boolean
  is_admin: boolean
  created_at: string
}

export interface Post {
  id: number
  title: string
  slug: string
  author_id: number
  visibility: string
  content_type: string
  likes_count: number
  claps_count: number
  created_at: string
}

export interface Comment {
  id: number
  post_id: number
  author_id: number
  content: string
  likes_count: number
  created_at: string
}

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await axiosClient.get('/api/v1/admin/stats')
    return response.data
  },

  getUsers: async (): Promise<User[]> => {
    const response = await axiosClient.get('/api/v1/admin/users')
    return response.data
  },

  getPosts: async (): Promise<Post[]> => {
    const response = await axiosClient.get('/api/v1/admin/posts')
    return response.data
  },

  getComments: async (): Promise<Comment[]> => {
    const response = await axiosClient.get('/api/v1/admin/comments')
    return response.data
  },

  deleteUser: async (userId: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/admin/users/${userId}`)
  },

  deletePost: async (postId: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/admin/posts/${postId}`)
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/admin/comments/${commentId}`)
  },
}

