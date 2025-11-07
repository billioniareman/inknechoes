import axiosClient from './axiosClient'

export interface Bookmark {
  id: number
  user_id: number
  post_id: number
  chapter_id?: number
  page_number: number
  note?: string
  created_at: string
  updated_at?: string
}

export interface BookmarkCreate {
  post_id: number
  chapter_id?: number
  page_number: number
  note?: string
}

export interface BookmarkUpdate {
  chapter_id?: number
  page_number?: number
  note?: string
}

export const bookmarksApi = {
  createBookmark: async (data: BookmarkCreate): Promise<Bookmark> => {
    const response = await axiosClient.post('/api/v1/bookmarks', data)
    return response.data
  },

  getMyBookmarks: async (): Promise<Bookmark[]> => {
    const response = await axiosClient.get('/api/v1/bookmarks/me')
    return response.data
  },

  getBookmarkForPost: async (postId: number): Promise<Bookmark | null> => {
    try {
      const response = await axiosClient.get(`/api/v1/bookmarks/post/${postId}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  updateBookmark: async (bookmarkId: number, data: BookmarkUpdate): Promise<Bookmark> => {
    const response = await axiosClient.put(`/api/v1/bookmarks/${bookmarkId}`, data)
    return response.data
  },

  deleteBookmark: async (bookmarkId: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/bookmarks/${bookmarkId}`)
  },
}

