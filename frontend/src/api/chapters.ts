import axiosClient from './axiosClient'

export interface ChapterContent {
  body: string
}

export interface Chapter {
  id: number
  post_id: number
  title: string
  order: number
  mongo_id: string
  created_at: string
  updated_at?: string
  content?: ChapterContent
}

export interface ChapterWithContent extends Chapter {
  content: ChapterContent
}

export interface ChapterCreate {
  title: string
  order: number
  content: ChapterContent
}

export interface ChapterUpdate {
  title?: string
  order?: number
  content?: ChapterContent
}

export const chaptersApi = {
  createChapter: async (postId: number, data: ChapterCreate): Promise<Chapter> => {
    const response = await axiosClient.post(`/api/v1/chapters?post_id=${postId}`, data, {
      params: { post_id: postId }
    })
    return response.data
  },

  getChapters: async (postId: number): Promise<Chapter[]> => {
    const response = await axiosClient.get(`/api/v1/chapters/post/${postId}`)
    return response.data
  },

  getChapter: async (chapterId: number): Promise<ChapterWithContent> => {
    const response = await axiosClient.get(`/api/v1/chapters/${chapterId}`)
    return response.data
  },

  updateChapter: async (chapterId: number, data: ChapterUpdate): Promise<Chapter> => {
    const response = await axiosClient.put(`/api/v1/chapters/${chapterId}`, data)
    return response.data
  },

  deleteChapter: async (chapterId: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/chapters/${chapterId}`)
  },
}

