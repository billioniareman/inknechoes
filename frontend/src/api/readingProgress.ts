import axiosClient from './axiosClient'

export interface ReadingProgress {
  id: number
  user_id: number
  post_id: number
  current_page: number
  total_pages: number
  progress_percentage: number
  reading_time_minutes: number
  last_read_at: string
  created_at: string
  updated_at?: string
}

export interface ReadingProgressUpdate {
  current_page?: number
  total_pages?: number
  progress_percentage?: number
  reading_time_minutes?: number
}

export interface ReadingStats {
  total_books_read: number
  total_reading_time_minutes: number
  total_pages_read: number
  average_completion: number
}

export const readingProgressApi = {
  getProgress: async (postId: number): Promise<ReadingProgress> => {
    const response = await axiosClient.get(`/api/v1/reading-progress/post/${postId}`)
    return response.data
  },

  updateProgress: async (postId: number, data: ReadingProgressUpdate): Promise<ReadingProgress> => {
    const response = await axiosClient.put(`/api/v1/reading-progress/post/${postId}`, data)
    return response.data
  },

  getStats: async (): Promise<ReadingStats> => {
    const response = await axiosClient.get('/api/v1/reading-progress/stats')
    return response.data
  },
}

