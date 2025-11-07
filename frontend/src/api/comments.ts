import axiosClient from './axiosClient'

export interface Comment {
  id: number
  post_id: number
  author_id: number
  parent_id?: number
  content: string
  likes_count: number
  created_at: string
  updated_at?: string
  author_username?: string
}

export interface CommentCreate {
  post_id: number
  content: string
  parent_id?: number
}

export interface CommentUpdate {
  content: string
}

export const commentsApi = {
  createComment: async (data: CommentCreate): Promise<Comment> => {
    const response = await axiosClient.post('/api/v1/comments', data)
    return response.data
  },

  getPostComments: async (postId: number): Promise<Comment[]> => {
    const response = await axiosClient.get(`/api/v1/comments/post/${postId}`)
    return response.data
  },

  getComment: async (commentId: number): Promise<Comment> => {
    const response = await axiosClient.get(`/api/v1/comments/${commentId}`)
    return response.data
  },

  updateComment: async (commentId: number, data: CommentUpdate): Promise<Comment> => {
    const response = await axiosClient.put(`/api/v1/comments/${commentId}`, data)
    return response.data
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/comments/${commentId}`)
  },

  likeComment: async (commentId: number): Promise<Comment> => {
    const response = await axiosClient.post(`/api/v1/comments/${commentId}/like`)
    return response.data
  },
}

